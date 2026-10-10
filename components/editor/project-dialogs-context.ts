import { createContext, use } from "react";

import type { ProjectDialogs } from "@/hooks/use-project-dialogs";

type ProjectDialogActions = Pick<ProjectDialogs, "openCreateDialog">;

// Lets editor pages open the project dialogs owned by EditorShell.
export const ProjectDialogsContext = createContext<ProjectDialogActions | null>(
  null,
);

export function useProjectDialogActions(): ProjectDialogActions {
  const actions = use(ProjectDialogsContext);
  if (!actions) {
    throw new Error("useProjectDialogActions must be used inside EditorShell");
  }
  return actions;
}
