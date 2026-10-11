import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

import type { AiStatusView } from "@/lib/ai-status";

// Slim line at the top of the AI Architect tab with the room's AI status,
// the same for everyone in the project: a spinner, the step's message and
// who started the run while it works; the result with a check or warning
// for a few seconds after it ends; nothing otherwise. The status region
// stays mounted (collapsed while empty), so screen readers announce each
// change.
export function AiStatusLine({ status }: { status: AiStatusView }) {
  return (
    <div
      role="status"
      className="flex shrink-0 items-start gap-2 border-b border-sidebar-border px-3 py-2 text-xs empty:hidden"
    >
      {status.kind !== "hidden" && <StatusContent status={status} />}
    </div>
  );
}

function StatusContent({ status }: { status: Exclude<AiStatusView, { kind: "hidden" }> }) {
  return (
    <>
      {status.kind === "active" && (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      )}
      {status.kind === "done" && (
        <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      {status.kind === "failed" && (
        <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
      )}
      <p className="min-w-0 flex-1 leading-4 wrap-break-word">
        {status.message}
        {status.kind === "active" && status.startedBy && (
          <span className="text-muted-foreground"> · started by {status.startedBy}</span>
        )}
      </p>
    </>
  );
}
