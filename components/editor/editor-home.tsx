"use client";

import { Plus } from "lucide-react";

import { useProjectDialogActions } from "@/components/editor/project-dialogs-context";
import { Button } from "@/components/ui/button";

// Empty-canvas landing content for /editor.
export function EditorHome() {
  const { openCreateDialog } = useProjectDialogActions();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="font-heading text-xl font-medium">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-muted-foreground">
          Start a new architecture workspace or choose a project from the
          sidebar.
        </p>
      </div>
      <Button onClick={openCreateDialog}>
        <Plus data-icon="inline-start" />
        New Project
      </Button>
    </div>
  );
}
