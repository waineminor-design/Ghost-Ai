import { useEffect } from "react";

import { useCanvasActions, type CanvasActionName } from "@/hooks/use-canvas-actions";
import { requestLabelEdit } from "@/lib/canvas-label-edit";

// Canvas keyboard shortcuts: + or = zooms in, - zooms out, Ctrl/Cmd+Z
// undoes, Ctrl/Cmd+Y and Ctrl/Cmd+Shift+Z redo, and F2 (or Enter on an
// already selected node or edge) edits the focused item's label. Ignored
// while typing in a text field (label editing, dialogs, chat). Must be
// used inside a RoomProvider and a ReactFlowProvider.
export function useCanvasShortcuts() {
  const actions = useCanvasActions();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;

      const labelEditId = getLabelEditTarget(event);
      if (labelEditId) {
        event.preventDefault();
        requestLabelEdit(labelEditId);
        return;
      }

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

// The id of the focused node or edge whose label should be edited, or null.
// F2 works on any focused item. Enter only on one that was already
// selected: React Flow's own Enter/Space handling selects a focused item,
// and its `selected` class only updates on the next render, so the class
// still shows the state from before this keypress.
function getLabelEditTarget(event: KeyboardEvent): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return null;
  }
  if (event.key !== "F2" && event.key !== "Enter") return null;
  if (!(event.target instanceof Element)) return null;

  const item = event.target.closest(".react-flow__node, .react-flow__edge");
  if (!item) return null;
  if (event.key === "Enter" && !item.classList.contains("selected")) return null;

  return item.getAttribute("data-id");
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
