import { useMemo } from "react";
import { useRedo, useUndo } from "@liveblocks/react/suspense";
import { useReactFlow } from "@xyflow/react";

// How long zoom and fit-view animations take.
const VIEWPORT_ANIMATION_MS = 200;

export type CanvasActionName = "zoomIn" | "zoomOut" | "fitView" | "undo" | "redo";
export type CanvasActions = Record<CanvasActionName, () => void>;

// The canvas control bar and keyboard shortcuts share these actions.
// Undo/redo use the Liveblocks room history, so they reverse this user's
// own synced canvas changes (a whole drag or resize is one step).
// Must be used inside a RoomProvider and a ReactFlowProvider.
export function useCanvasActions(): CanvasActions {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();

  return useMemo(
    () => ({
      zoomIn: () => void zoomIn({ duration: VIEWPORT_ANIMATION_MS }),
      zoomOut: () => void zoomOut({ duration: VIEWPORT_ANIMATION_MS }),
      fitView: () => void fitView({ duration: VIEWPORT_ANIMATION_MS }),
      undo,
      redo,
    }),
    [zoomIn, zoomOut, fitView, undo, redo],
  );
}
