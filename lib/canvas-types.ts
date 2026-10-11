import type { Edge, Node } from "@xyflow/react";

// The canvas node/edge schema. Everything that reads or writes canvas
// content (the canvas, Liveblocks storage, templates, AI generation, spec
// generation) uses these types instead of redefining them.

// What a node carries besides its React Flow position and size.
export type CanvasNodeData = {
  label: string;
  shape: string;
  color: string;
};

export type CanvasNode = Node<CanvasNodeData>;

// The React Flow edge type every new connection gets: a curved edge with an
// arrowhead and an optional label at its midpoint.
export const LABELED_EDGE_TYPE = "labeled";

// What an edge carries besides its endpoints. An empty label shows no
// label box. Edges created before labels existed have no `data`.
export type CanvasEdgeData = {
  label: string;
};

export type CanvasEdge = Edge<CanvasEdgeData>;
