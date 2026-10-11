import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

import { VIEWPORT_ANIMATION_MS } from "@/hooks/use-canvas-actions";
import type { AiChatMessage } from "@/lib/ai-chat";
import { sendJsonRequest } from "@/lib/api-client";

// The design run this user started: none, its start request in flight, or
// started (the token stays null until the token request answers).
type RunState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "started"; runId: string; token: string | null };

// How a followed run ended: finished successfully, failed (or was
// cancelled), or could no longer be followed.
export type DesignRunEnd = "succeeded" | "failed" | "lost";

export interface DesignRun {
  // True from sending a prompt until the run it started has ended.
  isBusy: boolean;
  // This user's messages whose design run couldn't start. Local only:
  // nobody else sees the error note.
  startFailedIds: ReadonlySet<string>;
  // Set only once both the run id and a non-empty token exist; the
  // component that follows the run must not mount before.
  followed: { runId: string; token: string } | null;
  // Starts a design run for a message this user just posted.
  start: (message: AiChatMessage) => void;
  // Called by the run's follower when it ends.
  end: (outcome: DesignRunEnd) => void;
}

// Starts design runs from the AI Architect chat and tracks the one this
// user started. Everyone in the room follows a run through its shared
// status line and the reply the design agent posts in the chat; only the
// starter follows it live through Trigger.dev, to know the moment it ends
// and fit their view to the new diagram. Must be used inside a
// ReactFlowProvider.
export function useDesignRun(projectId: string): DesignRun {
  const [run, setRun] = useState<RunState>({ phase: "idle" });
  const [startFailedIds, setStartFailedIds] = useState<ReadonlySet<string>>(new Set());
  const { fitView } = useReactFlow();
  // Set from start until the run ends: blocks a second start before the
  // re-render locks the composer, and cancels the requests on unmount.
  const activeRef = useRef<AbortController | null>(null);

  useEffect(() => () => activeRef.current?.abort(), []);

  const start = useCallback(
    async (message: AiChatMessage) => {
      if (activeRef.current) return;
      const controller = new AbortController();
      activeRef.current = controller;
      setRun({ phase: "starting" });

      let runId: string;
      try {
        const data = await sendJsonRequest("/api/ai/design", {
          method: "POST",
          body: { projectId, prompt: message.content },
          signal: controller.signal,
        });
        runId = readString(data, "runId");
      } catch {
        if (controller.signal.aborted) return;
        activeRef.current = null;
        setStartFailedIds((ids) => new Set(ids).add(message.id));
        setRun({ phase: "idle" });
        return;
      }
      setRun({ phase: "started", runId, token: null });

      try {
        const data = await sendJsonRequest(
          `/api/ai/runs/${encodeURIComponent(runId)}/token`,
          { method: "POST", signal: controller.signal },
        );
        const token = readString(data, "token");
        setRun({ phase: "started", runId, token });
      } catch {
        if (controller.signal.aborted) return;
        // The run carries on without being followed: the room's status
        // line still locks the composer and the reply still arrives in the
        // chat. Only the fit view at the end is lost.
        activeRef.current = null;
        setRun({ phase: "idle" });
      }
    },
    [projectId],
  );

  const end = useCallback(
    (outcome: DesignRunEnd) => {
      activeRef.current = null;
      setRun({ phase: "idle" });
      // The diagram reached the canvas through Liveblocks before the run
      // finished; React Flow fits it once its nodes are measured. Only
      // this user's view moves.
      if (outcome === "succeeded") void fitView({ duration: VIEWPORT_ANIMATION_MS });
    },
    [fitView],
  );

  return {
    isBusy: run.phase !== "idle",
    startFailedIds,
    followed:
      run.phase === "started" && run.token ? { runId: run.runId, token: run.token } : null,
    start: (message) => void start(message),
    end,
  };
}

// A non-empty string field of an API response; throws otherwise.
function readString(data: unknown, key: string): string {
  const value =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)[key]
      : undefined;
  if (typeof value !== "string" || value === "") {
    throw new Error(`The response has no ${key}`);
  }
  return value;
}
