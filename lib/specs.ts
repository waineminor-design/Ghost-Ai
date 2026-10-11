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
