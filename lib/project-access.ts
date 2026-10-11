import "server-only";

import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

import { findAccessibleProject, type ProjectRecord } from "@/lib/project-data";

export interface Identity {
  // Clerk user id.
  userId: string;
  // Primary email; collaborator rows are matched against it.
  email: string | null;
  // Display name (full name, else username) and avatar URL from Clerk.
  name: string | null;
  imageUrl: string | null;
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

  // Collaborator access is granted by email, so only a verified primary
  // address counts; an unverified one could belong to someone else.
  const user = await currentUser();
  const primary = user?.primaryEmailAddress;
  return {
    userId,
    email:
      primary?.verification?.status === "verified"
        ? primary.emailAddress
        : null,
    name: user?.fullName ?? user?.username ?? null,
    imageUrl: user?.imageUrl ?? null,
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
