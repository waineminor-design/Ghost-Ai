import { idempotencyKeys, tasks } from "@trigger.dev/sdk";

import { jsonError, readJsonObject } from "@/lib/api-response";
import { DESIGN_PROMPT_MAX_LENGTH } from "@/lib/design-prompt";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import {
  createTaskRun,
  deleteTaskRun,
  setTaskRunRunId,
} from "@/lib/task-run-data";
import type { designAgent } from "@/trigger/design-agent";

// POST /api/ai/design — body `{ projectId: string; prompt: string }`.
// Starts a `design-agent` run for the project and returns 202 with
// `{ runId }`. Owner or collaborator; anyone else gets 404 so the
// project's existence is not revealed. The AI work runs in the task, not
// here.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object", 400);

  const { projectId, prompt: rawPrompt } = body;
  if (typeof projectId !== "string" || projectId === "") {
    return jsonError("projectId must be a non-empty string", 400);
  }
  if (typeof rawPrompt !== "string") {
    return jsonError("prompt must be a string", 400);
  }
  const prompt = rawPrompt.trim();
  if (prompt.length === 0 || prompt.length > DESIGN_PROMPT_MAX_LENGTH) {
    return jsonError(
      `prompt must be 1 to ${DESIGN_PROMPT_MAX_LENGTH} characters`,
      400,
    );
  }

  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  // Record first, then trigger, so a run never exists without its row.
  const taskRun = await createTaskRun(projectId, identity.userId, "DESIGN");

  let runId: string;
  try {
    // The row id is unique, so a retried trigger call can't start a
    // second run. Global scope: the key is used as-is.
    const idempotencyKey = await idempotencyKeys.create(taskRun.id, {
      scope: "global",
    });
    const handle = await tasks.trigger<typeof designAgent>(
      "design-agent",
      {
        projectId,
        prompt,
        userId: identity.userId,
        // Shown to everyone in the room as "started by <name>".
        startedByName: identity.name ?? undefined,
      },
      { idempotencyKey },
    );
    runId = handle.id;
  } catch (error) {
    console.error(`Triggering design-agent for ${projectId} failed`, error);
    try {
      await deleteTaskRun(taskRun.id);
    } catch (deleteError) {
      console.error(`Deleting task run ${taskRun.id} failed`, deleteError);
    }
    return jsonError("Could not start the design run", 502);
  }

  await setTaskRunRunId(taskRun.id, runId);
  return Response.json({ runId }, { status: 202 });
}
