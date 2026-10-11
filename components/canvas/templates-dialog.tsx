import { useState } from "react";

import { TemplatePreview } from "@/components/canvas/template-preview";
import { EditorDialog } from "@/components/editor/editor-dialog";
import { useTemplatesDialogState } from "@/components/editor/templates-dialog-context";
import { Button } from "@/components/ui/button";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/lib/canvas-templates";

interface TemplatesDialogProps {
  // An empty canvas is replaced without asking.
  isCanvasEmpty: boolean;
  onImport: (template: CanvasTemplate) => void;
}

// The starter template library, opened from the navbar's Templates button.
// Each card previews a template's diagram; Import replaces the canvas with
// it, after a confirmation when the canvas has content.
// Must render inside EditorShell (for its open state) and the canvas.
export function TemplatesDialog({ isCanvasEmpty, onImport }: TemplatesDialogProps) {
  const { isOpen, setIsOpen } = useTemplatesDialogState();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // Kept after the confirmation closes, so its text doesn't change while
  // it animates out.
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null);

  function importTemplate(template: CanvasTemplate) {
    setIsConfirmOpen(false);
    setIsOpen(false);
    onImport(template);
  }

  function requestImport(template: CanvasTemplate) {
    if (isCanvasEmpty) {
      importTemplate(template);
      return;
    }
    setPendingTemplate(template);
    setIsConfirmOpen(true);
  }

  return (
    <EditorDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setIsConfirmOpen(false);
      }}
      title="Start from a template"
      description="Import a starter architecture onto the canvas. It replaces the current canvas for everyone in this project."
      // Wide, and as tall as the screen allows; the cards scroll inside.
      // nokey: Backspace or Delete pressed in the dialog doesn't delete the
      // selected nodes behind it.
      className="nokey max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-[min(80rem,calc(100%-4rem))]"
    >
      <div className="-m-1 overflow-y-auto p-1">
        <ul className="grid gap-4 lg:grid-cols-2">
          {CANVAS_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={() => requestImport(template)}
            />
          ))}
        </ul>
        {/* Nested in the templates dialog, so it stacks on top of it and
            Escape closes only the confirmation. */}
        <EditorDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          title="Replace the canvas?"
          description={`Importing ${pendingTemplate?.name ?? "this template"} replaces everything on the canvas, for everyone in this project. You can undo it afterwards.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (pendingTemplate) importTemplate(pendingTemplate);
                }}
              >
                Replace canvas
              </Button>
            </>
          }
        />
      </div>
    </EditorDialog>
  );
}

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: () => void;
}) {
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
      <div className="aspect-[5/2] border-b border-border bg-background p-3">
        <TemplatePreview template={template} />
      </div>
      <div className="flex flex-1 items-start justify-between gap-4 p-4">
        <div className="grid min-w-0 gap-1">
          <h3 className="text-sm font-medium">{template.name}</h3>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <Button size="sm" onClick={onImport} aria-label={`Import ${template.name}`}>
          Import
        </Button>
      </div>
    </li>
  );
}
