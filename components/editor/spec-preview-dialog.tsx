import { useEffect, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { SpecMarkdown } from "@/components/editor/spec-markdown";
import { buttonVariants } from "@/components/ui/button";
import { sendJsonRequest } from "@/lib/api-client";
import { parseSpecPreview, type SpecPreview } from "@/lib/specs";

// The answer for one spec id: the spec, or null when it couldn't load.
type LoadResult = { specId: string; spec: SpecPreview | null };

// Wide, tall dialog that shows a generated spec as readable Markdown, with
// its download in the footer. Loads the spec when opened for a spec id;
// keeps the id while closing so the content stays during the exit
// animation.
export function SpecPreviewDialog({
  projectId,
  specId,
  open,
  onOpenChange,
}: {
  projectId: string;
  specId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const specUrl = specId
    ? `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(specId)}`
    : null;
  // A result for another spec is stale: this one is still loading.
  const current = result && result.specId === specId ? result : null;
  const spec = current?.spec ?? null;

  useEffect(() => {
    if (!open || !specId || !specUrl) return;
    const controller = new AbortController();
    async function load(id: string, url: string) {
      let loaded: SpecPreview | null = null;
      try {
        loaded = parseSpecPreview(await sendJsonRequest(url, { signal: controller.signal }));
      } catch {
        // Shown as the friendly error below.
      }
      if (!controller.signal.aborted) setResult({ specId: id, spec: loaded });
    }
    void load(specId, specUrl);
    return () => controller.abort();
  }, [open, specId, specUrl]);

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title={spec?.title ?? "Spec preview"}
      // Most of the screen, header and footer fixed, the spec scrolling in
      // between. nokey: keys pressed in the dialog (it renders outside the
      // sidebar) don't reach the canvas behind it.
      className="nokey h-[min(56rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-4xl"
      footer={
        specUrl && (
          <a href={`${specUrl}/download`} download className={buttonVariants()}>
            <Download data-icon="inline-start" />
            Download
          </a>
        )
      }
    >
      <div className="-mx-4 overflow-y-auto border-t border-border px-4 py-4 sm:px-6">
        {!current ? (
          <div
            role="status"
            className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Loading the spec…
          </div>
        ) : spec ? (
          <SpecMarkdown markdown={spec.markdown} className="mx-auto max-w-3xl" />
        ) : (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t load the spec — try again
          </p>
        )}
      </div>
    </EditorDialog>
  );
}
