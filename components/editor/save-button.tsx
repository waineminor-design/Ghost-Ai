import { createPortal } from "react-dom";
import { Check, LoaderCircle, Save, TriangleAlert } from "lucide-react";

import { useSaveSlot } from "@/components/editor/save-slot-context";
import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

const STATUS_DISPLAY = {
  idle: { label: "Save", Icon: Save },
  saving: { label: "Saving…", Icon: LoaderCircle },
  saved: { label: "Saved", Icon: Check },
  error: { label: "Save failed", Icon: TriangleAlert },
} satisfies Record<CanvasSaveStatus, { label: string; Icon: typeof Save }>;

interface SaveButtonProps {
  status: CanvasSaveStatus;
  // False while the saved canvas is still being restored.
  canSave: boolean;
  onSave: () => void;
}

// The workspace's Save button, showing the autosave status. Renders into
// the navbar slot from SaveSlotContext; nothing until that slot exists.
// Must render inside EditorShell.
export function SaveButton(props: SaveButtonProps) {
  const slot = useSaveSlot();
  if (!slot) return null;

  return createPortal(<SaveButtonContent {...props} />, slot);
}

// Icon-only below `sm`, like the other navbar actions. Clicking saves
// now; after a failure that is the retry.
function SaveButtonContent({ status, canSave, onSave }: SaveButtonProps) {
  const { label, Icon } = STATUS_DISPLAY[status];
  const isError = status === "error";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSave}
        disabled={!canSave}
        aria-label={isError ? "Save failed, retry" : undefined}
        title={isError ? "Save failed. Click to retry." : undefined}
        className={cn("max-sm:pr-1.5", isError && "text-destructive")}
      >
        <Icon
          data-icon="inline-start"
          className={cn(status === "saving" && "animate-spin")}
          aria-hidden
        />
        <span className="max-sm:sr-only">{label}</span>
      </Button>
      {/* Announces failures only: saves succeed every few seconds while
          editing, and announcing each would be noise. */}
      <span role="status" className="sr-only">
        {isError ? "Saving the canvas failed" : ""}
      </span>
    </>
  );
}
