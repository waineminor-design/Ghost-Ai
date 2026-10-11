import "server-only";

import { randomInt } from "node:crypto";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toProjectSlug } from "@/lib/projects";

// Fields returned to callers. `canvasJsonPath` is an internal Blob
// pointer and stays out of API responses.
const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;

export interface UserProjects {
  owned: ProjectRecord[];
  shared: ProjectRecord[];
}

const ID_SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_SUFFIX_LENGTH = 6;
const MAX_ID_ATTEMPTS = 5;

function randomIdSuffix(): string {
  let suffix = "";
  for (let i = 0; i < ID_SUFFIX_LENGTH; i++) {
    suffix += ID_SUFFIX_ALPHABET[randomInt(ID_SUFFIX_ALPHABET.length)];
  }
  return suffix;
}

// `<slug>-<suffix>`, or `project-<suffix>` when the name has no slug.
// Also used as the Liveblocks room id, so it must stay URL-safe.
function generateProjectId(name: string): string {
  return `${toProjectSlug(name) || "project"}-${randomIdSuffix()}`;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

// Projects with a collaborator row whose email matches (case-insensitive).
function hasCollaboratorEmail(email: string): Prisma.ProjectWhereInput {
  return {
    collaborators: {
      some: { email: { equals: email, mode: "insensitive" } },
    },
  };
}

// Owned projects, plus projects where a collaborator row matches
// `email`. Newest first.
export async function listProjectsForUser(
  userId: string,
  email: string | null,
): Promise<UserProjects> {
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      select: projectSelect,
      orderBy: { createdAt: "desc" },
    }),
    email
      ? prisma.project.findMany({
          where: { ownerId: { not: userId }, ...hasCollaboratorEmail(email) },
          select: projectSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return { owned, shared };
}

// The project when `userId` owns it or a collaborator row matches
// `email`; null when it does not exist or the user has no access.
export async function findAccessibleProject(
  projectId: string,
  userId: string,
  email: string | null,
): Promise<ProjectRecord | null> {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        ...(email ? [hasCollaboratorEmail(email)] : []),
      ],
    },
    select: projectSelect,
  });
}

export async function createProject(
  ownerId: string,
  name: string,
): Promise<ProjectRecord> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.project.create({
        data: { id: generateProjectId(name), ownerId, name },
        select: projectSelect,
      });
    } catch (error) {
      // P2002: the generated id already exists; retry with a new suffix.
      if (!isPrismaError(error, "P2002") || attempt >= MAX_ID_ATTEMPTS) {
        throw error;
      }
    }
  }
}

// Owner's Clerk user id, or null when the project does not exist.
export async function getProjectOwnerId(
  projectId: string,
): Promise<string | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  return project?.ownerId ?? null;
}

// Ownership is part of the write filter, so these helpers never modify a
// project the caller does not own. Routes still call getProjectOwnerId
// first to tell 403 from 404.

// Null when the project does not exist or is not owned by `ownerId`.
export async function renameProject(
  projectId: string,
  ownerId: string,
  name: string,
): Promise<ProjectRecord | null> {
  try {
    return await prisma.project.update({
      where: { id: projectId, ownerId },
      data: { name },
      select: projectSelect,
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) return null;
    throw error;
  }
}

// Collaborators are removed by the database cascade. Returns false when
// the project does not exist or is not owned by `ownerId`.
export async function deleteProject(
  projectId: string,
  ownerId: string,
): Promise<boolean> {
  try {
    await prisma.project.delete({ where: { id: projectId, ownerId } });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2025")) return false;
    throw error;
  }
}

const collaboratorSelect = {
  id: true,
  email: true,
  createdAt: true,
} satisfies Prisma.ProjectCollaboratorSelect;

export type CollaboratorRecord = Prisma.ProjectCollaboratorGetPayload<{
  select: typeof collaboratorSelect;
}>;

// Oldest first, so the share list keeps invite order.
export async function listCollaborators(
  projectId: string,
): Promise<CollaboratorRecord[]> {
  return prisma.projectCollaborator.findMany({
    where: { projectId },
    select: collaboratorSelect,
    orderBy: { createdAt: "asc" },
  });
}

// `email` must already be normalized (lib/collaborators.ts), so the
// (projectId, email) unique index also catches case variants. Returns
// null when the email is already a collaborator. Callers check that the
// signed-in user owns the project first.
export async function addCollaborator(
  projectId: string,
  email: string,
): Promise<CollaboratorRecord | null> {
  try {
    return await prisma.projectCollaborator.create({
      data: { projectId, email },
      select: collaboratorSelect,
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) return null;
    throw error;
  }
}

// Ownership is part of the write filter, as in deleteProject. Returns
// false when the collaborator does not belong to a project `ownerId`
// owns.
export async function removeCollaborator(
  projectId: string,
  ownerId: string,
  collaboratorId: string,
): Promise<boolean> {
  try {
    await prisma.projectCollaborator.delete({
      where: { id: collaboratorId, projectId, project: { ownerId } },
    });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2025")) return false;
    throw error;
  }
}
