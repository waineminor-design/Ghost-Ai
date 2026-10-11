import { google } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import type { AiStatusStep } from "@/lib/ai-status";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";
import {
  applyDesignActions,
  describeChanges,
  type ApplyResult,
} from "@/lib/design-agent-actions";
import {
  describeCanvas,
  getCanvasCenter,
  readRoomCanvas,
} from "@/lib/design-agent-canvas";
import { appendAssistantMessage } from "@/lib/design-agent-chat";
import { createAiPresence } from "@/lib/design-agent-presence";
import { DESIGN_AGENT_SYSTEM_PROMPT } from "@/lib/design-agent-prompt";
import { writeAiStatus } from "@/lib/design-agent-status";
import { designAgentTools } from "@/lib/design-agent-tools";
import { getLiveblocks } from "@/lib/liveblocks";

// The Gemini models the agent uses, in order: if one is overloaded, errors
// or doesn't answer within the timeout, the next is tried. Change them here.
const DESIGN_AGENT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
] as const;

// Longest a single model call may take before moving to the next model, so
// a stalled request can't hold the run (and the AI presence) for an hour.
const MODEL_TIMEOUT_MS = 90_000;

type DesignGenerationInput = {
  prompt: string;
  // The run's abort signal (run cancelled or max duration reached).
  signal: AbortSignal;
  // Called before each model after the first.
  onFallback: () => Promise<void>;
};

// Asks each model in turn until one answers. Cancelling the run stops
// immediately; otherwise the last model's error is thrown.
async function generateDesign({ prompt, signal, onFallback }: DesignGenerationInput) {
  let lastError: unknown;
  for (const [index, model] of DESIGN_AGENT_MODELS.entries()) {
    if (index > 0) await onFallback();
    try {
      return await generateText({
        model: google(model),
        system: DESIGN_AGENT_SYSTEM_PROMPT,
        tools: designAgentTools,
        prompt,
        abortSignal: AbortSignal.any([signal, AbortSignal.timeout(MODEL_TIMEOUT_MS)]),
        maxRetries: 1,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
      logger.warn("design-agent model call failed; trying the next model", {
        model,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  throw lastError;
}

export interface DesignAgentPayload {
  projectId: string;
  prompt: string;
  userId: string;
  // Shown in the room's AI status ("started by <name>"); absent when the
  // run was started without one (e.g. from the Trigger.dev dashboard).
  startedByName?: string;
}

export interface DesignAgentOutput {
  actionsApplied: number;
  summary: string;
}

// Status messages the UI can subscribe to (run metadata, read with
// Trigger.dev realtime): `status` is the latest one, `statusLog` all of
// them in order. A retried attempt starts again at "started". Each one is
// also written to the room's `aiStatus` storage, which everyone in the
// project sees in the AI sidebar.
export type DesignAgentStep = Exclude<AiStatusStep, "idle">;

export type DesignAgentStatus = {
  step: DesignAgentStep;
  message: string;
  // ISO timestamp.
  at: string;
};

type StatusTarget = {
  roomId: string;
  runId: string;
  startedBy: string | null;
};

// Records a status in the run metadata and the room's `aiStatus`.
// `roomMessage` replaces the message in the room, where it must be short.
// A failed room write is logged, never thrown: the run must not fail (or,
// after applying, be retried and apply twice) over the status line.
async function recordStatus(
  target: StatusTarget,
  step: DesignAgentStep,
  message: string,
  roomMessage = message,
) {
  const status: DesignAgentStatus = { step, message, at: new Date().toISOString() };
  metadata.set("status", status).append("statusLog", status);
  try {
    await writeAiStatus(target.roomId, {
      step,
      message: roomMessage,
      runId: target.runId,
      startedBy: target.startedBy,
      updatedAt: status.at,
    });
  } catch (error) {
    logger.warn("design-agent could not write the room's AI status", {
      step,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Ghost AI's chat reply when a run fails. The error details stay in the
// run log; people only see this.
const FAILURE_REPLY = "I couldn't finish that design. Please try again.";

// Posts Ghost AI's reply to the room's chat, which everyone in the project
// sees, even if the person who started the run has left. Logged, never
// thrown: after a successful apply, a throw would retry the run and apply
// the changes twice.
async function postReply(roomId: string, content: string, runId: string) {
  try {
    await appendAssistantMessage(roomId, content, runId);
  } catch (error) {
    logger.warn("design-agent could not post its chat reply", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Reads the project's canvas, asks Gemini what to change for the prompt
// (as tool calls, one per canvas action), and applies the valid actions to
// the project's Liveblocks room in one storage mutation, so everyone in
// the room sees the diagram appear. Replies in the room's chat with the
// summary, or with a short failure message once every attempt has failed.
// Callers trigger it by id ("design-agent").
export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload, { ctx, signal }): Promise<DesignAgentOutput> => {
    // The room id is the project id.
    const roomId = payload.projectId;
    const presence = createAiPresence(roomId);
    const target: StatusTarget = {
      roomId,
      runId: ctx.run.id,
      startedBy: payload.startedByName ?? null,
    };

    try {
      await recordStatus(target, "started", "Reading the canvas");
      const canvas = await readRoomCanvas(roomId);
      await presence.show(getCanvasCenter(canvas.nodes));

      await recordStatus(target, "thinking", "Designing the changes");
      const result = await generateDesign({
        prompt: `Current canvas:\n${describeCanvas(canvas)}\n\nRequest:\n${payload.prompt}`,
        signal,
        // Also refreshes the status's time, so a long wait across models
        // isn't taken for a crashed run (stale after 3 minutes).
        onFallback: () =>
          recordStatus(target, "thinking", "Designing the changes (trying another model)"),
      });

      // Calls that don't match a tool's schema come back as dynamic,
      // invalid calls; they are skipped like any other invalid action.
      const calls = result.staticToolCalls;
      const invalidCalls = result.dynamicToolCalls.map((call) => ({
        toolName: call.toolName,
        reason: "input does not match the tool's schema",
      }));

      // Point the cursor at the first new node, where the diagram appears.
      const firstAdd = calls.find((call) => call.toolName === "addNode");
      if (firstAdd) await presence.show({ x: firstAdd.input.x, y: firstAdd.input.y });

      await recordStatus(
        target,
        "applying",
        `Applying ${calls.length} change${calls.length === 1 ? "" : "s"}`,
      );
      let applied: ApplyResult = { applied: 0, appliedByTool: {}, skipped: [] };
      if (calls.length > 0) {
        // Validated against the room as it is now (people may have edited
        // it while the model was thinking), in the format the canvas's
        // useLiveblocksFlow uses.
        await mutateFlow<CanvasNode, CanvasEdge>({ client: getLiveblocks(), roomId }, (flow) => {
          applied = applyDesignActions(flow, calls);
        });
      }

      const skipped = [...invalidCalls, ...applied.skipped];
      if (skipped.length > 0) logger.warn("design-agent skipped invalid actions", { skipped });

      const changes = describeChanges({ ...applied, skipped });
      const summary = [result.text.trim(), changes].filter(Boolean).join("\n\n");
      await postReply(roomId, summary, ctx.run.id);
      // The room's status line gets only the short count of changes.
      await recordStatus(target, "done", summary, changes);
      logger.log("design-agent applied actions", {
        applied: applied.applied,
        appliedByTool: applied.appliedByTool,
      });
      return { actionsApplied: applied.applied, summary };
    } catch (error) {
      // Details stay in the run log; the status is shown to people.
      logger.error("design-agent failed", {
        attempt: ctx.attempt.number,
        error: error instanceof Error ? error.message : String(error),
      });
      await recordStatus(target, "failed", "The design agent failed");
      throw error;
    } finally {
      // Nothing after a successful apply may throw, or a retry would apply
      // the changes twice.
      await presence.clear().catch((error: unknown) => {
        logger.warn("design-agent could not clear its presence", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  },
  // Called once, after the last retry fails (not for each failed attempt),
  // so the chat gets one failure reply. Trigger.dev skips it for crashed,
  // cancelled or timed-out runs. After `run`, so its types come from it.
  onFailure: async ({ payload, ctx }) => {
    await postReply(payload.projectId, FAILURE_REPLY, ctx.run.id);
  },
});
