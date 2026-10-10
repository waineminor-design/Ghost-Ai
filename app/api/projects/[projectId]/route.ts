import { auth } from "@clerk/nextjs/server";

import { jsonError, readJsonObject } from "@/lib/api-response";
import {
  deleteProject,
  getProjectOwnerId,
  renameProject,
} from "@/lib/project-data";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/projects";

// 404 when the project does not exist, 403 when `userId` is not its
// owner, null when the owner may proceed.
async function checkOwner(
  projectId: string,
  userId: string,
): Promise<Response | null> {
  const ownerId = await getProjectOwnerId(projectId);
  if (ownerId === null) return jsonError("Project not found", 404);
  if (ownerId !== userId) return jsonError("Forbidden", 403);
  return null;
}

// PATCH /api/projects/:projectId — body `{ name: string }`. Owner only.
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">,
) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object", 400);

  const rawName = body.name;
  if (typeof rawName !== "string") {
    return jsonError("name is required", 400);
  }
  const name = rawName.trim();
  if (name.length < 1 || name.length > PROJECT_NAME_MAX_LENGTH) {
    return jsonError(
      `name must be 1-${PROJECT_NAME_MAX_LENGTH} characters`,
      400,
    );
  }

  const { projectId } = await ctx.params;
  const denied = await checkOwner(projectId, userId);
  if (denied) return denied;

  const project = await renameProject(projectId, userId, name);
  if (!project) return jsonError("Project not found", 404);
  return Response.json(project);
}

// DELETE /api/projects/:projectId — owner only; collaborators cascade.
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">,
) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const { projectId } = await ctx.params;
  const denied = await checkOwner(projectId, userId);
  if (denied) return denied;

  const deleted = await deleteProject(projectId, userId);
  if (!deleted) return jsonError("Project not found", 404);
  return new Response(null, { status: 204 });
}
