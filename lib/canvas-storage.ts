import "server-only";

import { get, put } from "@vercel/blob";

import {
  CANVAS_SNAPSHOT_VERSION,
  parseCanvasSnapshot,
  type CanvasContent,
  type CanvasSnapshot,
} from "@/lib/canvas-snapshot";

// Canvas snapshots in the private Vercel Blob store. The SDK reads
// BLOB_READ_WRITE_TOKEN from the environment; Blob URLs and the token
// never leave the server. Callers check project access first.

// One snapshot per project, always at the same path.
function canvasSnapshotPath(projectId: string): string {
  return `canvas/${projectId}.json`;
}

// Writes (or overwrites) the project's snapshot. Returns its Blob path,
// for Project.canvasJsonPath, and the stored snapshot.
export async function saveCanvasSnapshot(
  projectId: string,
  content: CanvasContent,
): Promise<{ path: string; snapshot: CanvasSnapshot }> {
  const snapshot: CanvasSnapshot = {
    version: CANVAS_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    nodes: content.nodes,
    edges: content.edges,
  };
  const path = canvasSnapshotPath(projectId);

  await put(path, JSON.stringify(snapshot), {
    access: "private",
    // A stable path: no random suffix, and every save after the first
    // replaces the blob instead of failing because it exists.
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return { path, snapshot };
}

// The snapshot stored at `path`; null when there is no blob there. Throws
// when the blob can't be read or isn't a valid snapshot.
export async function loadCanvasSnapshot(
  path: string,
): Promise<CanvasSnapshot | null> {
  // useCache: false reads from origin storage, so a save made a moment
  // ago is never answered with an older cached copy.
  const result = await get(path, { access: "private", useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) {
    throw new Error(`Unexpected Blob status ${result.statusCode}`);
  }

  const text = await new Response(result.stream).text();
  const snapshot = parseCanvasSnapshot(JSON.parse(text));
  if (!snapshot) throw new Error(`Invalid canvas snapshot at ${path}`);
  return snapshot;
}
