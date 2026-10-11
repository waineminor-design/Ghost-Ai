import "server-only";

import { get, put } from "@vercel/blob";

// Generated specs (Markdown) in the private Vercel Blob store, like the
// canvas snapshots in lib/canvas-storage.ts. The SDK reads
// BLOB_READ_WRITE_TOKEN from the environment; Blob URLs and the token
// never leave the server. Callers check project access first.

// One file per spec-generator run.
function specPath(projectId: string, runId: string): string {
  return `specs/${projectId}/${runId}.md`;
}

// Writes the run's spec and returns its Blob path, for ProjectSpec.blobPath.
// A retried attempt of the same run writes to the same path and replaces
// the earlier file.
export async function saveSpecMarkdown(
  projectId: string,
  runId: string,
  markdown: string,
): Promise<string> {
  const path = specPath(projectId, runId);

  await put(path, markdown, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/markdown",
  });

  return path;
}

// The Markdown stored at `path`; null when there is no blob there. Throws
// when the blob can't be read.
export async function loadSpecMarkdown(path: string): Promise<string | null> {
  const result = await get(path, { access: "private", useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) {
    throw new Error(`Unexpected Blob status ${result.statusCode}`);
  }

  return new Response(result.stream).text();
}
