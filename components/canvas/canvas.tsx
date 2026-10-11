import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";

import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

// The shared React Flow canvas. Nodes and edges live in the room's
// Liveblocks storage, so every change syncs to everyone in the room.
// Theme colors come from the --xy-* token mapping in app/globals.css.
// Must render inside a RoomProvider and a Suspense boundary.
export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      colorMode="dark"
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap className="overflow-hidden rounded-lg border border-border" />
    </ReactFlow>
  );
}
