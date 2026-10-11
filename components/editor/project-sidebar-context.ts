import { createContext, use } from "react";

type ProjectSidebarVisibility = { isOpen: boolean };

// Lets the canvas read whether the project sidebar (owned by EditorShell)
// is open, so floating canvas controls can move out from under it.
export const ProjectSidebarContext = createContext<ProjectSidebarVisibility | null>(null);

export function useProjectSidebarVisibility(): ProjectSidebarVisibility {
  const visibility = use(ProjectSidebarContext);
  if (!visibility) {
    throw new Error("useProjectSidebarVisibility must be used inside EditorShell");
  }
  return visibility;
}
