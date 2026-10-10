export interface Project {
  id: string;
  name: string;
  // Clerk user id of the project owner.
  ownerId: string;
}

// URL-safe slug derived from a project name: lowercase ASCII letters and
// digits separated by single hyphens. Returns "" when the name has no
// letters or digits (e.g. "!!!").
export function toProjectSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DEFAULT_PROJECT_NAME = "Untitled Project";
export const PROJECT_NAME_MAX_LENGTH = 100;

// The signed-in user's projects, as loaded by the editor layout.
export interface EditorProjects {
  currentUserId: string;
  owned: Project[];
  shared: Project[];
}
