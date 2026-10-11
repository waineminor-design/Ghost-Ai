import { idempotencyKeys, runs, tasks } from "@trigger.dev/sdk";

import { jsonError, readJsonObject } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import {
  createTaskRun,
  deleteTaskRun,
  saveTaskRunRunId,
} from "@/lib/task-run-data";
import type { specGenerator } from "@/trigger/spec-generator";

// POST /api/ai/spec — body `{ projectId: string }`. Starts a
// `spec-generator` run for the project and returns 202 with `{ runId }`;
// follow it with POST /api/ai/runs/:runId/token. Owner or collaborator;
// anyone else gets 404 so the project's existence is not revealed. The AI
// work runs in the task, not here.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object", 400);

  const { projectId } = body;
  if (typeof projectId !== "string" || projectId === "") {
    return jsonError("projectId must be a non-empty string", 400);
  }

  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  // Record first, then trigger, so a run never exists without its row.
  const taskRun = await createTaskRun(projectId, identity.userId, "SPEC");

  let runId: string;
  try {
    // The row id is unique, so a retried trigger call can't start a
    // second run. Global scope: the key is used as-is.
    const idempotencyKey = await idempotencyKeys.create(taskRun.id, {
      scope: "global",
    });
    const handle = await tasks.trigger<typeof specGenerator>(
      "spec-generator",
      {
        projectId,
        userId: identity.userId,
        startedByName: identity.name ?? undefined,
      },
      { idempotencyKey },
    );
    runId = handle.id;
  } catch (error) {
    console.error(`Triggering spec-generator for ${projectId} failed`, error);
    try {
      await deleteTaskRun(taskRun.id);
    } catch (deleteError) {
      console.error(`Deleting task run ${taskRun.id} failed`, deleteError);
    }
    return jsonError("Could not start the spec run", 502);
  }

  if (!(await saveTaskRunRunId(taskRun.id, runId))) {
    // Without its row nobody could follow the run: stop it rather than
    // let it run untracked.
    try {
      await runs.cancel(runId);
    } catch (cancelError) {
      console.error(`Cancelling untracked run ${runId} failed`, cancelError);
    }
    try {
      await deleteTaskRun(taskRun.id);
    } catch (deleteError) {
      console.error(`Deleting task run ${taskRun.id} failed`, deleteError);
    }
    return jsonError("Could not start the spec run", 502);
  }
  return Response.json({ runId }, { status: 202 });
}
