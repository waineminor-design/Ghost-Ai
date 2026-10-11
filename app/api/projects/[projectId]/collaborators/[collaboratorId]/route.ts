import { jsonError } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { removeCollaborator } from "@/lib/project-data";

// DELETE /api/projects/:projectId/collaborators/:collaboratorId — owner
// only; collaborators get 403, users without access 404.
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators/[collaboratorId]">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { projectId, collaboratorId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);
  if (access.role !== "owner") return jsonError("Forbidden", 403);

  const removed = await removeCollaborator(
    projectId,
    identity.userId,
    collaboratorId,
  );
  if (!removed) return jsonError("Collaborator not found", 404);
  return new Response(null, { status: 204 });
}
