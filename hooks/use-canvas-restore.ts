import { useEffect, useEffectEvent, useState } from "react";
import { useHistory, useMutation } from "@liveblocks/react/suspense";
import type { OnEdgesChange, OnNodesChange } from "@xyflow/react";

import { ApiRequestError, sendJsonRequest } from "@/lib/api-client";
import {
  canvasSnapshotUrl,
  parseCanvasSnapshot,
  type CanvasContent,
  type CanvasSnapshot,
} from "@/lib/canvas-snapshot";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

// A failed snapshot lookup is retried this often, this many times in all.
const RETRY_DELAY_MS = 5000;
const MAX_ATTEMPTS = 3;

// The project's saved snapshot; null when it has none.
async function fetchCanvasSnapshot(
  projectId: string,
  signal: AbortSignal,
): Promise<CanvasSnapshot | null> {
  try {
    const data = await sendJsonRequest(canvasSnapshotUrl(projectId), {
      signal,
    });
    const snapshot = parseCanvasSnapshot(data);
    if (!snapshot) throw new Error("The saved canvas is invalid");
    return snapshot;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

type CanvasRestoreOptions = {
  projectId: string;
  // Whether the room's canvas is empty; only its first value is used.
  isCanvasEmpty: boolean;
  // From useLiveblocksFlow: they write nodes and edges into room storage.
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
};

// When the room's canvas is empty on load, loads the project's saved
// snapshot into it once, through the flow's own change handlers, so it
// syncs to everyone like any other edit. A room that has content is never
// touched, also if someone adds something while the snapshot loads.
// Returns true once the room is known to hold the right canvas (it had
// content, there was no snapshot, or the snapshot is in), so autosave
// can't replace a snapshot with the empty canvas before it is restored.
// Must be used inside a RoomProvider.
export function useCanvasRestore({
  projectId,
  isCanvasEmpty,
  onNodesChange,
  onEdgesChange,
}: CanvasRestoreOptions): boolean {
  const history = useHistory();
  const [needsRestore] = useState(isCanvasEmpty);
  const [isDone, setIsDone] = useState(!needsRestore);
  const [attempt, setAttempt] = useState(1);

  // Re-checks emptiness against storage at the moment of writing; the
  // adds and the check are one mutation, so nothing slips in between.
  // Returns whether the snapshot was loaded.
  const restore = useMutation(
    ({ storage }, content: CanvasContent): boolean => {
      const flow = storage.get("flow");
      if (flow.get("nodes").size > 0 || flow.get("edges").size > 0) {
        return false;
      }

      onNodesChange(content.nodes.map((item) => ({ type: "add", item })));
      onEdgesChange(content.edges.map((item) => ({ type: "add", item })));
      return true;
    },
    [onNodesChange, onEdgesChange],
  );

  const handleSnapshot = useEffectEvent((snapshot: CanvasSnapshot | null) => {
    // Loading the saved canvas is not an edit: undo must not empty the
    // room again (autosave would then save the empty canvas). Skipped
    // restores leave the history alone, so an edit made meanwhile stays
    // undoable.
    if (snapshot && restore(snapshot)) history.clear();
    setIsDone(true);
  });

  useEffect(() => {
    if (!needsRestore || isDone) return;

    // Aborted when the effect re-runs or the canvas unmounts (including
    // strict mode's extra unmount in development), so a stale response is
    // never applied.
    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    fetchCanvasSnapshot(projectId, controller.signal).then(
      (snapshot) => {
        if (!controller.signal.aborted) handleSnapshot(snapshot);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Loading the saved canvas failed", error);
        if (attempt < MAX_ATTEMPTS) {
          retryTimer = setTimeout(
            () => setAttempt((count) => count + 1),
            RETRY_DELAY_MS,
          );
        } else {
          // Give up and let autosave run; the room stays as it is.
          setIsDone(true);
        }
      },
    );

    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, [projectId, needsRestore, isDone, attempt]);

  return isDone;
}
