import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type LabelEditorProps = {
  initialLabel: string;
  // Same layout classes as the read-only label, so the text stays exactly
  // where the label normally sits while typing.
  className: string;
  // Accessible name, e.g. "Node label" or "Edge label".
  ariaLabel: string;
  // Called exactly once per edit: the trimmed label, or null when the edit
  // was cancelled.
  onDone: (label: string | null) => void;
};

// Edits a node or edge label in place. Enter commits, Shift+Enter adds a
// line, Escape cancels, and leaving the field commits. Mounted only while
// editing.
export function LabelEditor({ initialLabel, className, ariaLabel, onDone }: LabelEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Enter/Escape unmount the editor, which can fire a blur afterwards; this
  // keeps that blur from reporting the edit a second time.
  const isDoneRef = useRef(false);
  // Read once on mount: a collaborator renaming the label mid-edit must not
  // reset what is being typed.
  const initialLabelRef = useRef(initialLabel);

  // The text is set through the DOM, not React children: React must not
  // re-render the contents of an element the browser is editing.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.textContent = initialLabelRef.current;
    editor.focus();
    // Select the whole label, so typing replaces it.
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  function finish(label: string | null) {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    onDone(label);
  }

  function readLabel() {
    return (editorRef.current?.innerText ?? "").trim();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Keys typed here stay here: React Flow's edge wrapper handles Enter,
    // Space and Escape itself (select / deselect) and does not skip text
    // fields the way nodes do.
    event.stopPropagation();
    // Enter while an IME is composing confirms the composition, not the
    // label.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      finish(readLabel());
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(null);
    }
  }

  return (
    <div
      ref={editorRef}
      // Plain text only: pasted formatting is dropped and Shift+Enter
      // inserts a line break.
      contentEditable="plaintext-only"
      role="textbox"
      aria-multiline
      aria-label={ariaLabel}
      // nodrag: dragging selects text instead of moving the node.
      // nokey: React Flow ignores keys typed here (Backspace must not
      // delete the node or edge).
      className={cn(
        "nodrag nokey min-h-[1lh] min-w-1 cursor-text outline-none select-text",
        className,
      )}
      onKeyDown={handleKeyDown}
      onBlur={() => finish(readLabel())}
    />
  );
}
