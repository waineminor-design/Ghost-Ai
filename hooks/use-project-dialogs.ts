import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  // Message from the last failed request; the dialog stays open.
  error: string | null;
  setName: (name: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  closeDialog: () => void;
  submit: () => Promise<void>;
}

const FALLBACK_ERROR = "Something went wrong. Please try again.";

// Sends a project API request. Resolves with the parsed JSON body (null
// for 204); throws an Error carrying the API's `error` message otherwise.
async function sendProjectRequest(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: { name: string },
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection.");
  }

  const data: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : FALLBACK_ERROR;
    throw new Error(message);
  }
  return data;
}

// Owns dialog, form (name, slug), loading and error state for the
// create, rename and delete project dialogs, and calls the project API.
export function useProjectDialogs(): ProjectDialogs {
  const router = useRouter();
  const pathname = usePathname();

  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(
    null,
  );
  // Not cleared on close, so dialog content stays put during the exit
  // animation.
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  // Covers the navigation/refresh after a successful request, so the
  // dialog closes once the sidebar shows the change.
  const [isRefreshing, startRefresh] = useTransition();
  const isSubmitting = isRequesting || isRefreshing;

  const slug = toProjectSlug(name);
  const isNameValid = name.trim() !== "" && slug !== "";

  function openDialog(type: ProjectDialogType, project: Project | null) {
    setTargetProject(project);
    setError(null);
    setActiveDialog(type);
  }

  function openCreateDialog() {
    setName("");
    openDialog("create", null);
  }

  function openRenameDialog(project: Project) {
    setName(project.name);
    openDialog("rename", project);
  }

  function openDeleteDialog(project: Project) {
    openDialog("delete", project);
  }

  function closeDialog() {
    if (isSubmitting) return;
    setActiveDialog(null);
  }

  async function submit() {
    if (activeDialog === null || isSubmitting) return;
    if (activeDialog !== "delete" && !isNameValid) return;

    setError(null);
    setIsRequesting(true);
    try {
      if (activeDialog === "create") {
        const project = (await sendProjectRequest("/api/projects", "POST", {
          name,
        })) as Project;
        startRefresh(() => {
          setActiveDialog(null);
          router.push(`/editor/${encodeURIComponent(project.id)}`);
          router.refresh();
        });
        return;
      }

      if (!targetProject) {
        setError("No project selected. Close the dialog and try again.");
        return;
      }
      const projectPath = `/editor/${encodeURIComponent(targetProject.id)}`;
      const projectUrl = `/api/projects/${encodeURIComponent(targetProject.id)}`;

      if (activeDialog === "rename") {
        await sendProjectRequest(projectUrl, "PATCH", { name });
      } else {
        await sendProjectRequest(projectUrl, "DELETE");
      }

      startRefresh(() => {
        setActiveDialog(null);
        // Leave a project that no longer exists.
        if (activeDialog === "delete" && pathname === projectPath) {
          router.replace("/editor");
        }
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setIsRequesting(false);
    }
  }

  return {
    activeDialog,
    targetProject,
    name,
    slug,
    isNameValid,
    isSubmitting,
    error,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  };
}
