import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type Ref,
} from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DESIGN_PROMPT_MAX_LENGTH } from "@/lib/design-prompt";

export interface AiChatComposerHandle {
  focus: () => void;
}

interface AiChatComposerProps {
  ref?: Ref<AiChatComposerHandle>;
  value: string;
  onChange: (value: string) => void;
  canSend: boolean;
  onSend: () => void;
  // True while Ghost AI is working: nothing can be typed or sent.
  isLocked?: boolean;
}

// Message box at the bottom of the AI Architect tab. Grows with its text up
// to six lines, then scrolls. Enter sends, Shift+Enter adds a line. Canvas
// shortcuts ignore keys typed in a textarea, so typing here never zooms,
// undoes or deletes on the canvas. Disabled while locked, keeping the
// draft. Stops at the longest design prompt, so a message never fails to
// start a design run (or gets cut) for being too long.
export function AiChatComposer({
  ref,
  value,
  onChange,
  canSend,
  onSend,
  isLocked = false,
}: AiChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  // Sized from its content in JS (not `field-sizing: content`), so it grows
  // in every browser. `max-h` caps it at six lines.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borders}px`;
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Leave Enter alone while an IME is composing (it confirms the text).
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
      className="flex shrink-0 items-end gap-2 border-t border-sidebar-border p-3"
    >
      <Textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={DESIGN_PROMPT_MAX_LENGTH}
        disabled={isLocked}
        placeholder={isLocked ? "Ghost AI is working…" : "Describe a system…"}
        aria-label="Message AI Architect"
        className="field-sizing-fixed max-h-[calc(6lh+1rem+2px)] min-h-0 resize-none"
      />
      <Button
        type="submit"
        size="icon-lg"
        disabled={!canSend || isLocked}
        aria-label="Send message"
      >
        <ArrowUp />
      </Button>
    </form>
  );
}
