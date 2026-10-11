import { use } from "react";
import { useParams } from "next/navigation";

import type { EditorProjects, Project } from "@/lib/projects";

// The `projectId` route param on /editor/[projectId]; null elsewhere.
export function useCurrentProjectId(): string | null {
  const { projectId } = useParams<{ projectId?: string }>();
  return typeof projectId === "string" ? projectId : null;
}

// The open workspace's project, looked up in the user's project lists.
// Null when no workspace is open or the user can't access the project
// (the lists hold exactly the projects the user may open). Suspends until
// the lists load, so render it inside a Suspense boundary.
export function useCurrentProject(
  projectsPromise: Promise<EditorProjects>,
): Project | null {
  const projectId = useCurrentProjectId();
  const { owned, shared } = use(projectsPromise);
  if (projectId === null) return null;

  return [...owned, ...shared].find((p) => p.id === projectId) ?? null;
}
