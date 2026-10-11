import { useEffect } from "react";

import { useCanvasActions, type CanvasActionName } from "@/hooks/use-canvas-actions";

// Canvas keyboard shortcuts: + or = zooms in, - zooms out, Ctrl/Cmd+Z
// undoes, Ctrl/Cmd+Y and Ctrl/Cmd+Shift+Z redo. Ignored while typing in a
// text field (label editing, dialogs, chat). Must be used inside a
// RoomProvider and a ReactFlowProvider.
export function useCanvasShortcuts() {
  const actions = useCanvasActions();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;

      const action = getShortcutAction(event);
      if (!action) return;

      event.preventDefault();
      actions[action]();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"))
  );
}

function getShortcutAction(event: KeyboardEvent): CanvasActionName | null {
  // Alt combinations (and AltGr, which reports Ctrl+Alt) type characters.
  if (event.altKey) return null;

  if (event.ctrlKey || event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === "z") return event.shiftKey ? "redo" : "undo";
    if (key === "y" && !event.shiftKey) return "redo";
    // Ctrl/Cmd with + or - is the browser's own page zoom; leave it alone.
    return null;
  }

  if (event.key === "+" || event.key === "=") return "zoomIn";
  if (event.key === "-") return "zoomOut";
  return null;
}
