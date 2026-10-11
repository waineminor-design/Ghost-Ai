import { useEffect, useId, useState } from "react";
// The regular (non-suspense) hook: the AI sidebar must not suspend.
import { useStorage } from "@liveblocks/react";
import { Download, Eye, FileText, LoaderCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useSpecList } from "@/hooks/use-spec-list";
import type { SpecRun } from "@/hooks/use-spec-run";
import { formatRelativeTime } from "@/lib/relative-time";
import type { SpecSummary } from "@/lib/specs";

// How often the rows' relative dates ("5 min ago") are refreshed.
const NOW_REFRESH_MS = 60_000;

// The Specs tab: the Generate button with this user's run progress, then
// the project's specs, newest first, each with Preview and Download. The
// run and the preview dialog live in AiSidebar, so they survive switching
// tabs. The list loads when the tab opens. Must render inside a
// RoomProvider.
export function AiSpecsPanel({
  projectId,
  specRun,
  refreshKey,
  onPreview,
}: {
  projectId: string;
  specRun: SpecRun;
  // Changed by AiSidebar to reload the list (after this user's run).
  refreshKey: number;
  onPreview: (specId: string) => void;
}) {
  const hintId = useId();
  // null while storage loads. Selectors get the nodes map as a plain
  // object keyed by node id.
  const nodeCount = useStorage((root) => Object.keys(root.flow.nodes).length);
  const isCanvasEmpty = nodeCount === 0;
  const { specs, hasFailed: listFailed } = useSpecList(projectId, refreshKey);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Turn the canvas into a technical spec you can download as Markdown.
        </p>
        <Button
          onClick={specRun.start}
          disabled={nodeCount === null || isCanvasEmpty || specRun.isBusy}
          aria-describedby={isCanvasEmpty ? hintId : undefined}
          className="w-full"
        >
          <FileText data-icon="inline-start" />
          Generate spec
        </Button>
        {isCanvasEmpty && (
          <p id={hintId} className="text-xs text-muted-foreground">
            Add something to the canvas first
          </p>
        )}
        {/* Stays mounted (collapsed while empty), so screen readers
            announce each step. */}
        <div role="status" className="flex items-start gap-2 text-xs empty:hidden">
          {specRun.isBusy && (
            <>
              <LoaderCircle
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
              <p className="min-w-0 flex-1 leading-4 wrap-break-word">
                {specRun.stepMessage ?? "Starting…"}
              </p>
            </>
          )}
        </div>
        {specRun.hasFailed && (
          <p role="alert" className="text-xs text-destructive">
            Couldn&apos;t generate the spec — try again
          </p>
        )}
      </div>

      <section aria-label="Project specs" className="flex flex-col gap-2">
        {specs === null ? (
          listFailed ? (
            <p role="alert" className="text-xs text-destructive">
              Couldn&apos;t load the specs — try again later
            </p>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Loading specs…
            </p>
          )
        ) : specs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No specs yet — generate one from your diagram
          </p>
        ) : (
          <SpecRows projectId={projectId} specs={specs} onPreview={onPreview} />
        )}
      </section>
    </div>
  );
}

function SpecRows({
  projectId,
  specs,
  onPreview,
}: {
  projectId: string;
  specs: SpecSummary[];
  onPreview: (specId: string) => void;
}) {
  const now = useNow(NOW_REFRESH_MS);

  return (
    <ul className="flex flex-col gap-2">
      {specs.map((spec) => (
        <li
          key={spec.id}
          className="flex flex-col gap-3 rounded-lg border border-sidebar-border bg-card p-3 text-card-foreground"
        >
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="text-sm font-medium wrap-break-word">{spec.title}</h3>
              <p className="text-xs text-muted-foreground">
                <time dateTime={spec.createdAt} title={new Date(spec.createdAt).toLocaleString()}>
                  {formatRelativeTime(spec.createdAt, now)}
                </time>
                {spec.createdByName && <> · by {spec.createdByName}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(spec.id)}
              aria-label={`Preview ${spec.title}`}
            >
              <Eye data-icon="inline-start" />
              Preview
            </Button>
            <a
              href={`/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(spec.id)}/download`}
              download
              aria-label={`Download ${spec.title}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download data-icon="inline-start" />
              Download
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

// The current time in ms, refreshed every `intervalMs`.
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
