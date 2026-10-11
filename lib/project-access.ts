import "server-only";

import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

import { findAccessibleProject, type ProjectRecord } from "@/lib/project-data";

export interface Identity {
  // Clerk user id.
  userId: string;
  // Primary email; collaborator rows are matched against it.
  email: string | null;
}

export type ProjectRole = "owner" | "collaborator";

export interface ProjectAccess {
  project: ProjectRecord;
  role: ProjectRole;
}

// The signed-in user, or null when signed out. Cached per request so the
// editor layout and page share one Clerk user lookup.
export const getCurrentIdentity = cache(async (): Promise<Identity | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return {
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };
});

// The project and the user's role when they may open it; null when the
// project does not exist or the user is neither owner nor collaborator,
// so callers can't reveal which one it was.
export async function getProjectAccess(
  projectId: string,
  identity: Identity,
): Promise<ProjectAccess | null> {
  const project = await findAccessibleProject(
    projectId,
    identity.userId,
    identity.email,
  );
  if (!project) return null;

  return {
    project,
    role: project.ownerId === identity.userId ? "owner" : "collaborator",
  };
}
