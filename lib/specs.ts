import { toProjectSlug } from "@/lib/projects";

// Response shapes of the spec routes, shared by the server and the client.
// No Blob path or URL is ever part of them.

// One entry of GET /api/projects/:projectId/specs (`{ specs }`, newest
// first). `createdAt` is ISO.
export interface SpecSummary {
  id: string;
  title: string;
  createdAt: string;
  createdByName: string | null;
  sizeBytes: number;
}

export interface SpecList {
  specs: SpecSummary[];
}

// GET /api/projects/:projectId/specs/:specId, for the in-app preview.
export interface SpecPreview {
  id: string;
  title: string;
  createdAt: string;
  markdown: string;
}

// The download's file name: the title as a slug, plus `.md`. ASCII only,
// so it is safe in a Content-Disposition header.
export function toSpecFileName(title: string): string {
  return `${toProjectSlug(title) || "spec"}.md`;
}

// Validates a GET /api/projects/:projectId/specs response; null when it
// isn't one. Malformed entries are skipped.
export function parseSpecList(data: unknown): SpecSummary[] | null {
  if (!isRecord(data) || !Array.isArray(data.specs)) return null;
  return data.specs.flatMap((entry: unknown) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.createdAt !== "string" ||
      typeof entry.sizeBytes !== "number"
    ) {
      return [];
    }
    return [
      {
        id: entry.id,
        title: entry.title,
        createdAt: entry.createdAt,
        createdByName: typeof entry.createdByName === "string" ? entry.createdByName : null,
        sizeBytes: entry.sizeBytes,
      },
    ];
  });
}

// Validates a GET /api/projects/:projectId/specs/:specId response; null
// when it isn't one.
export function parseSpecPreview(data: unknown): SpecPreview | null {
  if (
    !isRecord(data) ||
    typeof data.id !== "string" ||
    typeof data.title !== "string" ||
    typeof data.createdAt !== "string" ||
    typeof data.markdown !== "string"
  ) {
    return null;
  }
  return { id: data.id, title: data.title, createdAt: data.createdAt, markdown: data.markdown };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
