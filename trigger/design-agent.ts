import { google } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

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
import { createAiPresence } from "@/lib/design-agent-presence";
import { DESIGN_AGENT_SYSTEM_PROMPT } from "@/lib/design-agent-prompt";
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
};

// Asks each model in turn until one answers. Cancelling the run stops
// immediately; otherwise the last model's error is thrown.
async function generateDesign({ prompt, signal }: DesignGenerationInput) {
  let lastError: unknown;
  for (const model of DESIGN_AGENT_MODELS) {
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
}

export interface DesignAgentOutput {
  actionsApplied: number;
  summary: string;
}

// Status messages the UI can subscribe to (run metadata, read with
// Trigger.dev realtime): `status` is the latest one, `statusLog` all of
// them in order. A retried attempt starts again at "started".
export type DesignAgentStep = "started" | "thinking" | "applying" | "done" | "failed";

export type DesignAgentStatus = {
  step: DesignAgentStep;
  message: string;
  // ISO timestamp.
  at: string;
};

function recordStatus(step: DesignAgentStep, message: string) {
  const status: DesignAgentStatus = { step, message, at: new Date().toISOString() };
  metadata.set("status", status).append("statusLog", status);
}

// Reads the project's canvas, asks Gemini what to change for the prompt
// (as tool calls, one per canvas action), and applies the valid actions to
// the project's Liveblocks room in one storage mutation, so everyone in
// the room sees the diagram appear. Callers trigger it by id
// ("design-agent").
export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload, { ctx, signal }): Promise<DesignAgentOutput> => {
    // The room id is the project id.
    const roomId = payload.projectId;
    const presence = createAiPresence(roomId);

    try {
      recordStatus("started", "Reading the canvas");
      const canvas = await readRoomCanvas(roomId);
      await presence.show(getCanvasCenter(canvas.nodes));

      recordStatus("thinking", "Designing the changes");
      const result = await generateDesign({
        prompt: `Current canvas:\n${describeCanvas(canvas)}\n\nRequest:\n${payload.prompt}`,
        signal,
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

      recordStatus(
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

      const summary = [result.text.trim(), describeChanges({ ...applied, skipped })]
        .filter(Boolean)
        .join("\n\n");
      recordStatus("done", summary);
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
      recordStatus("failed", "The design agent failed");
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
});
