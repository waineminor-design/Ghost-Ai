import { AbortTaskRunError, logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { withModelFallback } from "@/lib/ai-models";
import { describeCanvas, readRoomCanvas } from "@/lib/design-agent-canvas";
import { getProjectName } from "@/lib/project-data";
import { describeChat, readRecentChatMessages } from "@/lib/spec-generator-chat";
import { SPEC_GENERATOR_SYSTEM_PROMPT } from "@/lib/spec-generator-prompt";

export interface SpecGeneratorPayload {
  projectId: string;
  userId: string;
  // Who asked for the spec; absent when the run was started without one
  // (e.g. from the Trigger.dev dashboard).
  startedByName?: string;
}

export interface SpecGeneratorOutput {
  markdown: string;
  title: string;
}

// Status messages the UI can subscribe to (run metadata, read with
// Trigger.dev realtime): `status` is the latest one, `statusLog` all of
// them in order. A retried attempt starts again at "started". Unlike the
// design agent's, they are not written to the room.
export type SpecGeneratorStep = "started" | "generating" | "done" | "failed";

export type SpecGeneratorStatus = {
  step: SpecGeneratorStep;
  message: string;
  // ISO timestamp.
  at: string;
};

// Shown when the canvas has nothing to describe; the run fails without
// calling the model.
const EMPTY_CANVAS_MESSAGE = "Add something to the canvas before generating a spec";

const FAILURE_MESSAGE = "The spec generator failed";

// Records a status in the run metadata. Failed writes are logged, never
// thrown: the run must not fail over its status line.
function recordStatus(step: SpecGeneratorStep, message: string) {
  const status: SpecGeneratorStatus = { step, message, at: new Date().toISOString() };
  try {
    metadata.set("status", status).append("statusLog", status);
  } catch (error) {
    logger.warn("spec-generator could not record its run metadata", {
      step,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// The model is asked for bare Markdown; a reply wrapped in one code fence
// anyway is unwrapped.
function toMarkdown(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:markdown|md)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);
  return (fenced ? fenced[1] : trimmed).trim();
}

// Reads the project's canvas and the newest messages of its AI chat, and
// asks Gemini for a Markdown technical specification of the system on the
// canvas. Returns the Markdown and its title; nothing is stored here. An
// empty canvas fails at once, without retries. Callers trigger it by id
// ("spec-generator").
export const specGenerator = task({
  id: "spec-generator",
  run: async (payload: SpecGeneratorPayload, { ctx, signal }): Promise<SpecGeneratorOutput> => {
    // The room id is the project id.
    const roomId = payload.projectId;

    try {
      recordStatus("started", "Reading the canvas");
      const [projectName, canvas, chat] = await Promise.all([
        getProjectName(payload.projectId),
        readRoomCanvas(roomId),
        readRecentChatMessages(roomId),
      ]);
      // Neither can change on a retry, so neither is retried.
      if (projectName === null) throw new AbortTaskRunError("The project no longer exists");
      if (canvas.nodes.length === 0) throw new AbortTaskRunError(EMPTY_CANVAS_MESSAGE);

      recordStatus("generating", "Writing the spec");
      const result = await withModelFallback({
        label: "spec-generator",
        signal,
        // Also refreshes the status's time during a long wait across models.
        onFallback: async () => recordStatus("generating", "Writing the spec (trying another model)"),
        call: (settings) =>
          generateText({
            ...settings,
            system: SPEC_GENERATOR_SYSTEM_PROMPT,
            prompt: [
              `Project name: ${projectName}`,
              `Canvas:\n${describeCanvas(canvas)}`,
              `Recent chat messages (oldest first):\n${describeChat(chat)}`,
            ].join("\n\n"),
          }),
      });

      const markdown = toMarkdown(result.text);
      // Thrown, so the attempt is retried.
      if (!markdown) throw new Error("The model returned an empty spec");

      const title = `${projectName} — Technical Spec`;
      recordStatus("done", "Spec ready");
      logger.log("spec-generator wrote a spec", {
        startedBy: payload.startedByName ?? null,
        nodes: canvas.nodes.length,
        edges: canvas.edges.length,
        chatMessages: chat.length,
        characters: markdown.length,
      });
      return { markdown, title };
    } catch (error) {
      // Details stay in the run log; the status is shown to people.
      logger.error("spec-generator failed", {
        attempt: ctx.attempt.number,
        error: error instanceof Error ? error.message : String(error),
      });
      recordStatus(
        "failed",
        error instanceof AbortTaskRunError ? error.message : FAILURE_MESSAGE,
      );
      throw error;
    }
  },
});
