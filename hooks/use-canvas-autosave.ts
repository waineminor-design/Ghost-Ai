import { useEffect, useState } from "react";

import { sendJsonRequest } from "@/lib/api-client";
import { canvasSnapshotUrl, toCanvasContent } from "@/lib/canvas-snapshot";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

// Autosave runs this long after the last canvas change.
const AUTOSAVE_DELAY_MS = 3000;
// How long "Saved" shows before the button reads "Save" again.
const SAVED_DISPLAY_MS = 2000;
// Browsers refuse keepalive requests whose bodies exceed 64 KiB.
const KEEPALIVE_MAX_BYTES = 64 * 1024;

type SaveRequest = {
  // Save even when nothing changed since the last successful save.
  force: boolean;
  // The page may be closing: let the request outlive it if it can.
  keepalive: boolean;
};

// The save logic, outside React: it keeps the latest canvas, debounces
// changes, runs one save at a time and reports the status. Created once
// per mount and never torn down, so React strict mode's extra
// unmount/remount in development can't leave it in a dead state.
function createCanvasSaver(
  url: string,
  onStatusChange: (status: CanvasSaveStatus) => void,
) {
  let nodes: readonly CanvasNode[] = [];
  let edges: readonly CanvasEdge[] = [];
  let isEnabled = false;
  // JSON of what the server last accepted (or of the canvas when saving
  // was enabled). Automatic saves of the same content are skipped.
  let lastSavedJson: string | null = null;
  let isSaving = false;
  // A save requested while another one was in flight; runs right after.
  let queued: SaveRequest | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function save(request: SaveRequest): Promise<void> {
    if (!isEnabled) return;
    clearTimeout(timer);
    if (isSaving) {
      queued = {
        force: request.force || (queued?.force ?? false),
        keepalive: request.keepalive || (queued?.keepalive ?? false),
      };
      return;
    }

    const content = toCanvasContent(nodes, edges);
    const json = JSON.stringify(content);
    if (!request.force && json === lastSavedJson) return;

    isSaving = true;
    onStatusChange("saving");
    let succeeded = false;
    try {
      await sendJsonRequest(url, {
        method: "PUT",
        body: content,
        keepalive:
          request.keepalive &&
          new Blob([json]).size <= KEEPALIVE_MAX_BYTES,
      });
      lastSavedJson = json;
      succeeded = true;
    } catch {
      // Shown as "Save failed"; a click or the next change retries.
    } finally {
      isSaving = false;
    }

    const next = queued;
    queued = null;
    if (next) {
      void save(next);
      // That save is now in flight and reports its own result.
      if (isSaving) return;
    }
    onStatusChange(succeeded ? "saved" : "error");
  }

  return {
    // Latest canvas; while enabled, (re)starts the autosave countdown.
    update(nextNodes: readonly CanvasNode[], nextEdges: readonly CanvasEdge[]) {
      nodes = nextNodes;
      edges = nextEdges;
      if (!isEnabled) return;
      clearTimeout(timer);
      timer = setTimeout(
        () => void save({ force: false, keepalive: false }),
        AUTOSAVE_DELAY_MS,
      );
    },
    // Starts saving. The canvas at this moment counts as saved: it is what
    // the room (or the restored snapshot) already holds.
    enable() {
      if (isEnabled) return;
      isEnabled = true;
      lastSavedJson = JSON.stringify(toCanvasContent(nodes, edges));
    },
    // The Save button: saves now, even when nothing changed.
    save() {
      void save({ force: true, keepalive: false });
    },
    // Leaving the page: saves now if anything is unsaved.
    flush() {
      void save({ force: false, keepalive: true });
    },
  };
}

type CanvasAutosaveOptions = {
  projectId: string;
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
  // False until the room is known to hold the right canvas (see
  // useCanvasRestore); nothing is saved before that.
  enabled: boolean;
};

// Saves the canvas as the project's snapshot: ~3 s after the last change,
// immediately through `save()` (the Save button), and once more when the
// page is hidden or closed, or the workspace is left, with unsaved changes.
// `status` drives the Save button: "saved" turns back into "idle" after a
// moment.
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: CanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const [saver] = useState(() =>
    createCanvasSaver(canvasSnapshotUrl(projectId), setStatus),
  );

  useEffect(() => {
    saver.update(nodes, edges);
  }, [saver, nodes, edges]);

  useEffect(() => {
    if (enabled) saver.enable();
  }, [saver, enabled]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") saver.flush();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saver.flush);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saver.flush);
      saver.flush();
    };
  }, [saver]);

  useEffect(() => {
    if (status !== "saved") return;
    const timeout = setTimeout(() => setStatus("idle"), SAVED_DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  return { status, canSave: enabled, save: saver.save };
}
