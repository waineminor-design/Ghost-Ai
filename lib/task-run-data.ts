import "server-only";

import { Prisma, type TaskRunKind } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const taskRunSelect = {
  id: true,
  runId: true,
  projectId: true,
  userId: true,
  kind: true,
  createdAt: true,
} satisfies Prisma.TaskRunSelect;

export type TaskRunRecord = Prisma.TaskRunGetPayload<{
  select: typeof taskRunSelect;
}>;

// The tracking row for a run that is about to be triggered; `runId` stays
// null until setTaskRunRunId. Callers check project access first.
export async function createTaskRun(
  projectId: string,
  userId: string,
  kind: TaskRunKind,
): Promise<TaskRunRecord> {
  return prisma.taskRun.create({
    data: { projectId, userId, kind },
    select: taskRunSelect,
  });
}

// Stores the Trigger.dev run id once the task was triggered.
export async function setTaskRunRunId(
  id: string,
  runId: string,
): Promise<void> {
  await prisma.taskRun.update({ where: { id }, data: { runId } });
}

// Removes the row of a run that could not be triggered.
export async function deleteTaskRun(id: string): Promise<void> {
  await prisma.taskRun.deleteMany({ where: { id } });
}

// Null when no row has this Trigger.dev run id. Callers check that the
// signed-in user may open the row's project.
export async function findTaskRunByRunId(
  runId: string,
): Promise<TaskRunRecord | null> {
  return prisma.taskRun.findUnique({
    where: { runId },
    select: taskRunSelect,
  });
}
