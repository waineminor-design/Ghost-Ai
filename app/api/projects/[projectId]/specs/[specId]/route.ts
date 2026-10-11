import { jsonError } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { findProjectSpec } from "@/lib/spec-data";
import { loadSpecMarkdown } from "@/lib/spec-storage";
import type { SpecPreview } from "@/lib/specs";

// GET /api/projects/:projectId/specs/:specId — one spec with its Markdown
// (`{ id, title, createdAt, markdown }`), for the in-app preview. Owner or
// collaborator; anyone else, or a spec of another project, gets 404. The
// file is read on the server; no Blob URL is returned.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { projectId, specId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  const spec = await findProjectSpec(projectId, specId);
  if (!spec) return jsonError("Spec not found", 404);

  try {
    const markdown = await loadSpecMarkdown(spec.blobPath);
    if (markdown === null) return jsonError("Spec not found", 404);

    const preview: SpecPreview = {
      id: spec.id,
      title: spec.title,
      createdAt: spec.createdAt.toISOString(),
      markdown,
    };
    return Response.json(preview);
  } catch (error) {
    console.error(`Reading spec ${specId} of ${projectId} failed`, error);
    return jsonError("Could not load the spec", 500);
  }
}
