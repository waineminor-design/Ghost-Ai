import { jsonError } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { listProjectSpecs } from "@/lib/spec-data";
import type { SpecList } from "@/lib/specs";

// GET /api/projects/:projectId/specs — the project's generated specs,
// newest first (`{ specs }`, without their Markdown). Owner or
// collaborator; anyone else gets 404 so the project's existence is not
// revealed.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { projectId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  const rows = await listProjectSpecs(projectId);
  const list: SpecList = {
    specs: rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      createdByName: row.createdByName,
      sizeBytes: row.sizeBytes,
    })),
  };
  return Response.json(list);
}
