import { jsonError, readJsonObject } from "@/lib/api-response";
import {
  CANVAS_SNAPSHOT_MAX_BYTES,
  parseCanvasContent,
} from "@/lib/canvas-snapshot";
import { loadCanvasSnapshot, saveCanvasSnapshot } from "@/lib/canvas-storage";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { getCanvasJsonPath, setCanvasJsonPath } from "@/lib/project-data";

const MAX_SIZE_LABEL = `${CANVAS_SNAPSHOT_MAX_BYTES / (1024 * 1024)} MB`;

// GET /api/projects/:projectId/canvas — the latest canvas snapshot
// (`{ version, savedAt, nodes, edges }`), 404 when none was saved. Owner
// or collaborator; anyone else gets 404 so the project's existence is not
// revealed. The snapshot is read on the server; no Blob URL is returned.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const { projectId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  const path = await getCanvasJsonPath(projectId);
  if (!path) return jsonError("No saved canvas", 404);

  try {
    const snapshot = await loadCanvasSnapshot(path);
    if (!snapshot) return jsonError("No saved canvas", 404);
    return Response.json(snapshot);
  } catch (error) {
    console.error(`Reading the canvas snapshot of ${projectId} failed`, error);
    return jsonError("Could not load the saved canvas", 500);
  }
}

// PUT /api/projects/:projectId/canvas — body `{ nodes, edges }` (at most
// 2 MB). Saves it as the project's snapshot, replacing the previous one.
// Owner or collaborator; anyone else gets 404.
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">,
) {
  const identity = await getCurrentIdentity();
  if (!identity) return jsonError("Unauthorized", 401);

  const body = await readJsonObject(request, {
    maxBytes: CANVAS_SNAPSHOT_MAX_BYTES,
  });
  if (!body) {
    return jsonError(
      `Request body must be a JSON object of at most ${MAX_SIZE_LABEL}`,
      400,
    );
  }
  const content = parseCanvasContent(body);
  if (!content) {
    return jsonError("nodes and edges must be arrays of canvas items", 400);
  }

  const { projectId } = await ctx.params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) return jsonError("Project not found", 404);

  try {
    const { path, snapshot } = await saveCanvasSnapshot(projectId, content);
    await setCanvasJsonPath(projectId, path);
    return Response.json({
      version: snapshot.version,
      savedAt: snapshot.savedAt,
    });
  } catch (error) {
    console.error(`Saving the canvas snapshot of ${projectId} failed`, error);
    return jsonError("Could not save the canvas", 500);
  }
}
