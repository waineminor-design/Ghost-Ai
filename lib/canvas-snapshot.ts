import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

// A saved copy of a project's canvas, stored in Vercel Blob by
// PUT /api/projects/:projectId/canvas. Shared by the route (validates what
// it stores) and the canvas (builds what it sends, validates what it
// restores).

export const CANVAS_SNAPSHOT_VERSION = 1;

// Largest request body the canvas route accepts.
export const CANVAS_SNAPSHOT_MAX_BYTES = 2 * 1024 * 1024;

export type CanvasContent = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export type CanvasSnapshot = CanvasContent & {
  version: typeof CANVAS_SNAPSHOT_VERSION;
  // ISO timestamp set by the server.
  savedAt: string;
};

// React Flow state that stays on one client (useLiveblocksFlow doesn't
// sync it either), so it is never saved.
const LOCAL_NODE_KEYS: readonly string[] = [
  "selected",
  "dragging",
  "measured",
  "resizing",
];
const LOCAL_EDGE_KEYS: readonly string[] = ["selected"];

export function canvasSnapshotUrl(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/canvas`;
}

function withoutKeys<T extends object>(value: T, keys: readonly string[]): T {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  ) as T;
}

// The canvas as it is saved: nodes and edges without their local-only
// state, so selecting or dragging alone never counts as a change.
export function toCanvasContent(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): CanvasContent {
  return {
    nodes: nodes.map((node) => withoutKeys(node, LOCAL_NODE_KEYS)),
    edges: edges.map((edge) => withoutKeys(edge, LOCAL_EDGE_KEYS)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// Structural checks only: enough for React Flow and Liveblocks to accept
// the node. Data fields are not checked one by one, so nodes saved before
// a field existed still load.
function isCanvasNode(value: unknown): value is CanvasNode {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isRecord(value.position) &&
    Number.isFinite(value.position.x) &&
    Number.isFinite(value.position.y) &&
    isRecord(value.data)
  );
}

function isCanvasEdge(value: unknown): value is CanvasEdge {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.source) &&
    isNonEmptyString(value.target) &&
    (value.data === undefined || isRecord(value.data))
  );
}

// `{ nodes, edges }` from untrusted input, without local-only state; null
// unless both are arrays of valid nodes and edges.
export function parseCanvasContent(value: unknown): CanvasContent | null {
  if (!isRecord(value)) return null;
  const { nodes, edges } = value;
  if (!Array.isArray(nodes) || !nodes.every(isCanvasNode)) return null;
  if (!Array.isArray(edges) || !edges.every(isCanvasEdge)) return null;
  return toCanvasContent(nodes, edges);
}

// A stored or fetched snapshot; null when it isn't a valid version 1
// snapshot.
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (!isRecord(value)) return null;
  if (value.version !== CANVAS_SNAPSHOT_VERSION) return null;
  if (typeof value.savedAt !== "string") return null;

  const content = parseCanvasContent(value);
  if (!content) return null;
  return {
    version: CANVAS_SNAPSHOT_VERSION,
    savedAt: value.savedAt,
    ...content,
  };
}
