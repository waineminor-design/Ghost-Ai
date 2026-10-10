import { useId } from "react";
import { LoaderCircle } from "lucide-react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectDialogs as ProjectDialogsState } from "@/hooks/use-project-dialogs";

// The server appends a random 6-character suffix to the slug to form the
// project (room) id; the preview shows its shape.
const ROOM_ID_SUFFIX_PLACEHOLDER = "-xxxxxx";

interface ProjectDialogsProps {
  dialogs: ProjectDialogsState;
}

// Create, rename and delete project dialogs, driven by useProjectDialogs.
export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  const {
    activeDialog,
    targetProject,
    name,
    slug,
    isNameValid,
    isSubmitting,
    error,
    setName,
    closeDialog,
    submit,
  } = dialogs;

  function handleOpenChange(open: boolean) {
    if (!open) closeDialog();
  }

  const nameFormProps = {
    name,
    slug,
    isNameValid,
    isSubmitting,
    error,
    onNameChange: setName,
    onOpenChange: handleOpenChange,
    onSubmit: submit,
  };

  return (
    <>
      <ProjectNameDialog
        {...nameFormProps}
        open={activeDialog === "create"}
        title="Create project"
        description="Name your new architecture workspace."
        submitLabel="Create"
        pendingLabel="Creating…"
        previewLabel="Room ID"
        previewSuffix={ROOM_ID_SUFFIX_PLACEHOLDER}
      />
      <ProjectNameDialog
        {...nameFormProps}
        open={activeDialog === "rename"}
        title="Rename project"
        description="Choose a new name for this project."
        submitLabel="Rename"
        pendingLabel="Renaming…"
        previewLabel="Slug"
      />
      <DeleteProjectDialog
        open={activeDialog === "delete"}
        projectName={targetProject?.name ?? ""}
        isSubmitting={isSubmitting}
        error={error}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
    </>
  );
}

interface ProjectNameDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  previewLabel: string;
  previewSuffix?: string;
  name: string;
  slug: string;
  isNameValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

function ProjectNameDialog({
  open,
  title,
  description,
  submitLabel,
  pendingLabel,
  previewLabel,
  previewSuffix = "",
  name,
  slug,
  isNameValid,
  isSubmitting,
  error,
  onNameChange,
  onOpenChange,
  onSubmit,
}: ProjectNameDialogProps) {
  const formId = useId();
  const inputId = useId();
  const slugId = useId();

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!isNameValid || isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {isSubmitting ? pendingLabel : submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor={inputId} className="text-sm font-medium">
          Project name
        </label>
        <Input
          id={inputId}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Payments Platform"
          autoComplete="off"
          readOnly={isSubmitting}
          aria-describedby={slugId}
        />
        <SlugPreview
          id={slugId}
          label={previewLabel}
          name={name}
          slug={slug}
          suffix={previewSuffix}
        />
        <RequestError message={error} />
      </form>
    </EditorDialog>
  );
}

function SlugPreview({
  id,
  label,
  name,
  slug,
  suffix,
}: {
  id: string;
  label: string;
  name: string;
  slug: string;
  suffix: string;
}) {
  let content;
  if (slug) {
    content = (
      <>
        {label}:{" "}
        <span className="font-mono text-foreground">
          {slug}
          {suffix}
        </span>
      </>
    );
  } else if (name.trim()) {
    content = (
      <span className="text-destructive">
        The name must contain at least one letter or number.
      </span>
    );
  } else {
    content = "The slug is generated from the name.";
  }

  return (
    <p id={id} aria-live="polite" className="text-xs text-muted-foreground">
      {content}
    </p>
  );
}

// Failed request message, shown inside the dialog that sent it.
function RequestError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  isSubmitting: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

function DeleteProjectDialog({
  open,
  projectName,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete project"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {isSubmitting ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">{projectName}</span>? The
        project and everything in it will be permanently deleted. This cannot
        be undone.
      </p>
      <RequestError message={error} />
    </EditorDialog>
  );
}
