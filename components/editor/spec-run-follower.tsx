import { useEffect } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import type { SpecRunEnd } from "@/hooks/use-spec-run";
import type { specGenerator } from "@/trigger/spec-generator";

// Follows the spec run this user started, live through Trigger.dev:
// reports each new step message from the run's metadata, and the end with
// the saved spec's id. Renders nothing. Mount it only with a run id and a
// non-empty token (useRealtimeRun throws "missing access token" during
// render otherwise), keyed by the run id so each run starts fresh.
export function SpecRunFollower({
  runId,
  token,
  onStep,
  onEnd,
}: {
  runId: string;
  token: string;
  onStep: (message: string) => void;
  onEnd: (result: SpecRunEnd) => void;
}) {
  // The metadata carries the step, the output the spec's id; the payload
  // isn't needed.
  const { run, error } = useRealtimeRun<typeof specGenerator>(runId, {
    accessToken: token,
    skipColumns: ["payload"],
  });
  const stepMessage = readStepMessage(run?.metadata?.status);
  // Final states only, so a failed attempt that will be retried doesn't
  // end it. `isCompleted` covers success and every failure, but not a
  // cancelled run.
  const hasEnded = run ? run.isCompleted || run.isCancelled : false;
  const isSuccess = run?.isSuccess ?? false;
  const specId = typeof run?.output?.specId === "string" ? run.output.specId : null;

  useEffect(() => {
    if (stepMessage) onStep(stepMessage);
  }, [stepMessage, onStep]);

  useEffect(() => {
    if (hasEnded) onEnd(isSuccess ? { outcome: "succeeded", specId } : { outcome: "failed" });
    else if (error) onEnd({ outcome: "lost" });
  }, [hasEnded, isSuccess, specId, error, onEnd]);

  return null;
}

// The message of the run's `status` metadata (`SpecGeneratorStatus`), or
// null when it is missing or malformed. A `failed` step is skipped: the
// attempt may be retried, and a run that really fails ends with the
// panel's own friendly error, never the task's message.
function readStepMessage(status: unknown): string | null {
  if (typeof status !== "object" || status === null) return null;
  const { step, message } = status as Record<string, unknown>;
  if (step === "failed") return null;
  return typeof message === "string" && message !== "" ? message : null;
}
