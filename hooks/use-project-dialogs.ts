import { useState } from "react";

import { toProjectSlug, type Project } from "@/lib/projects";

export type ProjectDialogType = "create" | "rename" | "delete";

export interface ProjectDialogs {
  activeDialog: ProjectDialogType | null;
  // The project being renamed or deleted; null for create.
  targetProject: Project | null;
  name: string;
  slug: string;
  // False when the name is blank or produces an empty slug.
  isNameValid: boolean;
  isSubmitting: boolean;
  setName: (name: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
}

// Simulated request time until the project API exists.
const MOCK_REQUEST_MS = 600;

// Owns dialog, form (name, slug) and loading state for the create,
// rename and delete project dialogs.
export function useProjectDialogs(): ProjectDialogs {
  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(
    null,
  );
  // Not cleared on close, so dialog content stays put during the exit
  // animation.
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = toProjectSlug(name);
  const isNameValid = name.trim() !== "" && slug !== "";

  function openCreateDialog() {
    setTargetProject(null);
    setName("");
    setActiveDialog("create");
  }

  function openRenameDialog(project: Project) {
    setTargetProject(project);
    setName(project.name);
    setActiveDialog("rename");
  }

  function openDeleteDialog(project: Project) {
    setTargetProject(project);
    setActiveDialog("delete");
  }

  function closeDialog() {
    if (isSubmitting) return;
    setActiveDialog(null);
  }

  async function submit() {
    if (activeDialog === null || isSubmitting) return;
    if (activeDialog !== "delete" && !isNameValid) return;

    setIsSubmitting(true);
    try {
      // UI only: no API call yet.
      await new Promise((resolve) => setTimeout(resolve, MOCK_REQUEST_MS));
      setActiveDialog(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    activeDialog,
    targetProject,
    name,
    slug,
    isNameValid,
    isSubmitting,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  };
}
