import { auth } from "@trigger.dev/sdk";

import { jsonError } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { findTaskRunByRunId } from "@/lib/task-run-data";

const TOKEN_EXPIRATION = "1h";

// POST /api/ai/runs/:runId/token — `{ token }`: a Trigger.dev public
// access token that can only read this one run, for following it live in
// the browser. Owner or collaborator of the run's project; unknown runs
// and anyone else get 404. The secret key never leaves the server.
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/ai/runs/[runId]/token">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { runId } = await ctx.params;
  const taskRun = await findTaskRunByRunId(runId);
  if (!taskRun?.runId) return jsonError("Run not found", 404);

  const access = await getProjectAccess(taskRun.projectId, identity);
  if (!access) return jsonError("Run not found", 404);

  try {
    const token = await auth.createPublicToken({
      scopes: { read: { runs: [taskRun.runId] } },
      expirationTime: TOKEN_EXPIRATION,
    });
    return Response.json({ token });
  } catch (error) {
    console.error(`Creating a token for run ${runId} failed`, error);
    return jsonError("Could not create a run token", 502);
  }
}
