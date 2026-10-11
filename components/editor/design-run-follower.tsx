import { useEffect } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import type { DesignRunEnd } from "@/hooks/use-design-run";

// Follows the design run this user started, live through Trigger.dev, and
// reports when it ends. Renders nothing. Mount it only with a run id and a
// non-empty token (useRealtimeRun throws "missing access token" during
// render otherwise), keyed by the run id so each run starts fresh.
export function DesignRunFollower({
  runId,
  token,
  onEnd,
}: {
  runId: string;
  token: string;
  onEnd: (outcome: DesignRunEnd) => void;
}) {
  // Only the run's state is needed; its payload, output and metadata are
  // left out of the subscription.
  const { run, error } = useRealtimeRun(runId, {
    accessToken: token,
    skipColumns: ["payload", "output", "metadata"],
  });
  // Final states only, so a failed attempt that will be retried doesn't
  // end it. `isCompleted` covers success and every failure, but not a
  // cancelled run.
  const hasEnded = run ? run.isCompleted || run.isCancelled : false;
  const isSuccess = run?.isSuccess ?? false;

  useEffect(() => {
    if (hasEnded) onEnd(isSuccess ? "succeeded" : "failed");
    else if (error) onEnd("lost");
  }, [hasEnded, isSuccess, error, onEnd]);

  return null;
}
