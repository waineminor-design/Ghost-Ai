import { useCallback, useEffect, useRef, useState } from "react";

import { sendJsonRequest } from "@/lib/api-client";

// The spec run this user started: none, its start request in flight, or
// started (the token stays null until the token request answers).
type RunState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "started"; runId: string; token: string | null };

// How a followed spec run ended: finished with the saved spec's id, failed
// (or was cancelled), or could no longer be followed.
export type SpecRunEnd =
  | { outcome: "succeeded"; specId: string | null }
  | { outcome: "failed" }
  | { outcome: "lost" };

export interface SpecRun {
  // True from clicking Generate until the run it started has ended.
  isBusy: boolean;
  // The run's current step message (from its metadata); null until the
  // run reports one.
  stepMessage: string | null;
  // True after this user's last spec run couldn't start or failed. Local
  // only, cleared by the next start.
  hasFailed: boolean;
  // Set only once both the run id and a non-empty token exist; the
  // component that follows the run must not mount before.
  followed: { runId: string; token: string } | null;
  // Starts a spec run for the project.
  start: () => void;
  // Called by the run's follower with each new step message.
  report: (message: string) => void;
  // Called by the run's follower when it ends.
  end: (result: SpecRunEnd) => void;
}

// Starts spec runs from the Specs tab and tracks the one this user
// started, following it live through Trigger.dev for its step messages and
// the moment it ends. `onSucceeded` gets the new spec's id (null if the
// run didn't report one). Only the starter sees the progress; everyone's
// spec list refreshes through the room's `specsUpdatedAt`.
export function useSpecRun(
  projectId: string,
  onSucceeded: (specId: string | null) => void,
): SpecRun {
  const [run, setRun] = useState<RunState>({ phase: "idle" });
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  // Set from start until the run ends: blocks a second start before the
  // re-render disables the button, and cancels the requests on unmount.
  const activeRef = useRef<AbortController | null>(null);

  useEffect(() => () => activeRef.current?.abort(), []);

  const end = useCallback(
    (result: SpecRunEnd) => {
      activeRef.current = null;
      setRun({ phase: "idle" });
      setStepMessage(null);
      if (result.outcome === "succeeded") onSucceeded(result.specId);
      else if (result.outcome === "failed") setHasFailed(true);
    },
    [onSucceeded],
  );

  const start = useCallback(async () => {
    if (activeRef.current) return;
    const controller = new AbortController();
    activeRef.current = controller;
    setHasFailed(false);
    setStepMessage(null);
    setRun({ phase: "starting" });

    let runId: string;
    try {
      const data = await sendJsonRequest("/api/ai/spec", {
        method: "POST",
        body: { projectId },
        signal: controller.signal,
      });
      runId = readString(data, "runId");
    } catch {
      if (controller.signal.aborted) return;
      end({ outcome: "failed" });
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
      // The run carries on without being followed live: when it saves the
      // spec, the room's `specsUpdatedAt` refreshes the list anyway.
      end({ outcome: "lost" });
    }
  }, [projectId, end]);

  const report = useCallback((message: string) => setStepMessage(message), []);

  return {
    isBusy: run.phase !== "idle",
    stepMessage,
    hasFailed,
    followed:
      run.phase === "started" && run.token ? { runId: run.runId, token: run.token } : null,
    start: () => void start(),
    report,
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
