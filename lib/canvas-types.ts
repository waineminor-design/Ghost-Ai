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

export type CanvasEdge = Edge;
