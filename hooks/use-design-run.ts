import { useCallback, useEffect, useRef, useState } from "react";
// The regular (non-suspense) hook: the AI sidebar must not suspend.
import { useStorage } from "@liveblocks/react";
import { useReactFlow } from "@xyflow/react";

import { VIEWPORT_ANIMATION_MS } from "@/hooks/use-canvas-actions";
import type { AiChatMessage } from "@/lib/ai-chat";
import { AI_STATUS_STALE_MS, parseAiStatus, type AiStatus } from "@/lib/ai-status";
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
  // Safety unlock for a run that can't be followed live (its token request
  // failed): ends it after the time a room status takes to go stale.
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The room's AI status, which the design agent writes for everyone.
  const roomStatus = parseAiStatus(useStorage((root) => root.aiStatus) ?? null);

  useEffect(
    () => () => {
      activeRef.current?.abort();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    },
    [],
  );

  const end = useCallback(
    (outcome: DesignRunEnd) => {
      activeRef.current = null;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setRun({ phase: "idle" });
      // The diagram reached the canvas through Liveblocks before the run
      // finished; React Flow fits it once its nodes are measured. Only
      // this user's view moves.
      if (outcome === "succeeded") void fitView({ duration: VIEWPORT_ANIMATION_MS });
    },
    [fitView],
  );

  const start = useCallback(
    async (message: AiChatMessage) => {
      // A previous run that wasn't followed live but has ended in the room
      // no longer blocks a new one.
      if (activeRef.current && !hasRoomEnded(run, roomStatus)) return;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
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
        // The run carries on without being followed live. Stay busy (the
        // room's status may not show it yet, and unlocking now would let a
        // second run start): the room's done/failed status ends it, and
        // this timer is the safety unlock if that never arrives.
        fallbackTimerRef.current = setTimeout(() => end("lost"), AI_STATUS_STALE_MS);
      }
    },
    [projectId, end, run, roomStatus],
  );

  return {
    // A run that can't be followed live counts as ended once the room's
    // status for it shows done or failed (see `hasRoomEnded`).
    isBusy: run.phase !== "idle" && !hasRoomEnded(run, roomStatus),
    startFailedIds,
    followed:
      run.phase === "started" && run.token ? { runId: run.runId, token: run.token } : null,
    start: (message) => void start(message),
    end,
  };
}

// True when this user's run can't be followed live (its token is pending
// or its token request failed) and the room's status already shows that
// run as done or failed.
function hasRoomEnded(run: RunState, roomStatus: AiStatus | null): boolean {
  return (
    run.phase === "started" &&
    !run.token &&
    roomStatus?.runId === run.runId &&
    (roomStatus.step === "done" || roomStatus.step === "failed")
  );
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
