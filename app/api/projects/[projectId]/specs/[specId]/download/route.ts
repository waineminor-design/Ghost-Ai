import { jsonError } from "@/lib/api-response";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { findProjectSpec } from "@/lib/spec-data";
import { loadSpecMarkdown } from "@/lib/spec-storage";
import { toSpecFileName } from "@/lib/specs";

// GET /api/projects/:projectId/specs/:specId/download — the spec's raw
// Markdown as a file download named after its title
// (`<slug-of-title>.md`). Owner or collaborator; anyone else, or a spec of
// another project, gets 404. The file is read on the server; no Blob URL
// is returned.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]/download">,
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

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${toSpecFileName(spec.title)}"`,
      },
    });
  } catch (error) {
    console.error(`Downloading spec ${specId} of ${projectId} failed`, error);
    return jsonError("Could not load the spec", 500);
  }
}
