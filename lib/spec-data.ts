import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Fields the spec routes may return. `blobPath` is an internal Blob
// pointer and stays out of this list.
const specSummarySelect = {
  id: true,
  title: true,
  createdAt: true,
  createdByName: true,
  sizeBytes: true,
} satisfies Prisma.ProjectSpecSelect;

export type SpecSummaryRecord = Prisma.ProjectSpecGetPayload<{
  select: typeof specSummarySelect;
}>;

// A spec with its Blob path, for reading the file on the server. Never
// sent to clients as is.
export type SpecFileRecord = SpecSummaryRecord & { blobPath: string };

export interface SaveProjectSpecInput {
  projectId: string;
  runId: string;
  title: string;
  blobPath: string;
  sizeBytes: number;
  createdBy: string;
  createdByName: string | null;
}

// Creates the run's spec row, or updates it when an earlier attempt of the
// same run already saved one (`runId` is unique), so a run never has two.
// Returns the row id.
export async function upsertProjectSpec(
  input: SaveProjectSpecInput,
): Promise<string> {
  const { runId, ...fields } = input;
  const spec = await prisma.projectSpec.upsert({
    where: { runId },
    create: { runId, ...fields },
    update: fields,
    select: { id: true },
  });
  return spec.id;
}

// The project's specs, newest first. Callers check project access first.
export async function listProjectSpecs(
  projectId: string,
): Promise<SpecSummaryRecord[]> {
  return prisma.projectSpec.findMany({
    where: { projectId },
    select: specSummarySelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

// Null when the spec does not exist or belongs to another project.
// Callers check access to `projectId` first.
export async function findProjectSpec(
  projectId: string,
  specId: string,
): Promise<SpecFileRecord | null> {
  return prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { ...specSummarySelect, blobPath: true },
  });
}
