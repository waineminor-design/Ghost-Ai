import { tool, type StaticToolCall } from "ai";
import { z } from "zod";

import { NODE_COLORS, type NodeColor } from "@/lib/canvas-colors";
import {
  CANVAS_SHAPES,
  NODE_HANDLE_SIDES,
  type CanvasShape,
} from "@/lib/canvas-shapes";

// The design agent's canvas actions. Each action is its own tool, so the
// model answers with a list of small tool calls instead of one large
// structured object. The tools have no `execute`: the task collects the
// calls, validates them against the live canvas and applies the valid ones
// in one storage mutation (lib/design-agent-actions.ts).

const SHAPE_NAMES = CANVAS_SHAPES.map((shape) => shape.name) as [
  CanvasShape,
  ...CanvasShape[],
];
const COLOR_KEYS = Object.keys(NODE_COLORS) as [NodeColor, ...NodeColor[]];

const nodeReference = z
  .string()
  .describe(
    "An existing node id from the canvas description, or the key of a node created with addNode in this response",
  );
const shape = z.enum(SHAPE_NAMES).describe("Node shape");
const color = z.enum(COLOR_KEYS).describe("Node color key");
const label = z.string().describe("Short text shown on the node or edge");
const x = z.number().describe("Left edge of the node, in canvas units");
const y = z.number().describe("Top edge of the node, in canvas units");
const width = z.number().describe("Node width in canvas units");
const height = z.number().describe("Node height in canvas units");
const handle = z.enum(NODE_HANDLE_SIDES);
const edgeId = z.string().describe("An existing edge id from the canvas description");

export const designAgentTools = {
  addNode: tool({
    description:
      "Add a node. Pick a short unique key (e.g. api-gateway) so other calls in this response can reference it.",
    inputSchema: z.object({
      key: z.string().describe("Short unique key for this new node, e.g. api-gateway"),
      shape,
      label,
      color,
      x,
      y,
      width: width.optional().describe("Defaults to the shape's default width"),
      height: height.optional().describe("Defaults to the shape's default height"),
    }),
  }),
  updateNode: tool({
    description: "Change a node's label and/or color.",
    inputSchema: z.object({
      node: nodeReference,
      label: label.optional(),
      color: color.optional(),
    }),
  }),
  moveNode: tool({
    description: "Move a node to a new position.",
    inputSchema: z.object({ node: nodeReference, x, y }),
  }),
  resizeNode: tool({
    description: "Resize a node.",
    inputSchema: z.object({ node: nodeReference, width, height }),
  }),
  deleteNode: tool({
    description: "Delete a node and every edge connected to it.",
    inputSchema: z.object({ node: nodeReference }),
  }),
  addEdge: tool({
    description:
      "Connect two nodes with an arrow from source to target. Give it a short label describing the interaction (protocol, event or action).",
    inputSchema: z.object({
      source: nodeReference,
      target: nodeReference,
      label: label.optional(),
      sourceHandle: handle
        .optional()
        .describe("Side of the source node the edge leaves from; defaults to right"),
      targetHandle: handle
        .optional()
        .describe("Side of the target node the edge enters; defaults to left"),
    }),
  }),
  updateEdge: tool({
    description: "Change an existing edge's label.",
    inputSchema: z.object({ edge: edgeId, label }),
  }),
  deleteEdge: tool({
    description: "Delete an existing edge.",
    inputSchema: z.object({ edge: edgeId }),
  }),
};

export type DesignAgentToolCall = StaticToolCall<typeof designAgentTools>;
