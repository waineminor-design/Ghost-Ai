import "server-only";

import { getCanvasShape } from "@/lib/canvas-shapes";
import { getLiveblocks } from "@/lib/liveblocks";

// The design agent's view of a room's canvas: what the model is told about
// the existing diagram before it decides what to change.

export type CanvasNodeSummary = {
  id: string;
  label: string;
  shape: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasEdgeSummary = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type CanvasSummary = {
  nodes: CanvasNodeSummary[];
  edges: CanvasEdgeSummary[];
};

// Loads the room's current nodes and edges (room id = project id). Storage
// is external input, so every node and edge is checked; anything without
// the fields the canvas needs is left out.
export async function readRoomCanvas(roomId: string): Promise<CanvasSummary> {
  const document: unknown = await getLiveblocks().getStorageDocument(roomId, "json");
  const flow = isRecord(document) && isRecord(document.flow) ? document.flow : {};
  const nodes = isRecord(flow.nodes) ? Object.values(flow.nodes) : [];
  const edges = isRecord(flow.edges) ? Object.values(flow.edges) : [];

  return {
    nodes: nodes.flatMap((node) => {
      const summary = toNodeSummary(node);
      return summary ? [summary] : [];
    }),
    edges: edges.flatMap((edge) => {
      const summary = toEdgeSummary(edge);
      return summary ? [summary] : [];
    }),
  };
}

// One line per node and edge, numbers rounded: compact enough for large
// diagrams, explicit enough that the model can reference ids exactly.
export function describeCanvas({ nodes, edges }: CanvasSummary): string {
  if (nodes.length === 0) return "The canvas is empty.";

  const bounds = getBounds(nodes);
  const lines = [
    `Existing content spans x ${bounds.minX}..${bounds.maxX}, y ${bounds.minY}..${bounds.maxY}.`,
    "",
    "Nodes (id | label | shape | color | x,y | width x height):",
    ...nodes.map(
      (node) =>
        `- ${node.id} | ${JSON.stringify(node.label)} | ${node.shape} | ${node.color} | ${Math.round(node.x)},${Math.round(node.y)} | ${Math.round(node.width)}x${Math.round(node.height)}`,
    ),
    "",
    "Edges (id | source -> target | label):",
    ...(edges.length === 0
      ? ["- none"]
      : edges.map(
          (edge) =>
            `- ${edge.id} | ${edge.source} -> ${edge.target} | ${JSON.stringify(edge.label)}`,
        )),
  ];
  return lines.join("\n");
}

// Center of the existing content, or the origin for an empty canvas.
export function getCanvasCenter(nodes: CanvasNodeSummary[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 };
  const { minX, maxX, minY, maxY } = getBounds(nodes);
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function getBounds(nodes: CanvasNodeSummary[]) {
  return {
    minX: Math.round(Math.min(...nodes.map((node) => node.x))),
    maxX: Math.round(Math.max(...nodes.map((node) => node.x + node.width))),
    minY: Math.round(Math.min(...nodes.map((node) => node.y))),
    maxY: Math.round(Math.max(...nodes.map((node) => node.y + node.height))),
  };
}

function toNodeSummary(value: unknown): CanvasNodeSummary | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const { position, data } = value;
  if (!isRecord(position) || !isFiniteNumber(position.x) || !isFiniteNumber(position.y)) {
    return null;
  }

  const nodeData = isRecord(data) ? data : {};
  const shape = typeof nodeData.shape === "string" ? nodeData.shape : "rectangle";
  // Nodes saved before a size was stored fall back to their shape's default.
  const defaults = getCanvasShape(shape) ?? { width: 160, height: 80 };

  return {
    id: value.id,
    label: typeof nodeData.label === "string" ? nodeData.label : "",
    shape,
    color: typeof nodeData.color === "string" ? nodeData.color : "default",
    x: position.x,
    y: position.y,
    width: isFiniteNumber(value.width) ? value.width : defaults.width,
    height: isFiniteNumber(value.height) ? value.height : defaults.height,
  };
}

function toEdgeSummary(value: unknown): CanvasEdgeSummary | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.source !== "string" ||
    typeof value.target !== "string"
  ) {
    return null;
  }
  // Edges created before labels existed have no `data`.
  const label = isRecord(value.data) && typeof value.data.label === "string" ? value.data.label : "";
  return { id: value.id, source: value.source, target: value.target, label };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
