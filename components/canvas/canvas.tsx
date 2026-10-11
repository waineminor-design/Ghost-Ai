import { useRef, type DragEvent } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";

import { ShapeNode } from "@/components/canvas/shape-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import { DEFAULT_NODE_COLOR } from "@/lib/canvas-colors";
import {
  SHAPE_DRAG_MIME,
  SHAPE_NODE_TYPE,
  parseShapeDragPayload,
} from "@/lib/canvas-shapes";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

// Defined once, outside the component: React Flow re-mounts every node
// when this object changes identity.
const NODE_TYPES: NodeTypes = { [SHAPE_NODE_TYPE]: ShapeNode };

// The shared React Flow canvas. Nodes and edges live in the room's
// Liveblocks storage, so every change syncs to everyone in the room.
// Theme colors come from the --xy-* token mapping in app/globals.css.
// Must render inside a RoomProvider and a Suspense boundary.
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
}

function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  // Makes node ids unique even for two drops in the same millisecond.
  const dropCounter = useRef(0);

  // Without preventDefault here the browser never fires `drop`.
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  // A shape dropped from the panel becomes a node centered on the drop
  // point. It is added through the Liveblocks flow, so it appears for
  // everyone in the room.
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const payload = parseShapeDragPayload(
      event.dataTransfer.getData(SHAPE_DRAG_MIME),
    );
    if (!payload) return;

    const center = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    dropCounter.current += 1;

    const node: CanvasNode = {
      id: `${payload.shape}-${Date.now()}-${dropCounter.current}`,
      type: SHAPE_NODE_TYPE,
      position: {
        x: center.x - payload.width / 2,
        y: center.y - payload.height / 2,
      },
      data: { label: "", shape: payload.shape, color: DEFAULT_NODE_COLOR },
      width: payload.width,
      height: payload.height,
    };

    onNodesChange([{ type: "add", item: node }]);
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      connectionMode={ConnectionMode.Loose}
      colorMode="dark"
    >
      <Background variant={BackgroundVariant.Dots} />
      <ShapePanel />
      <MiniMap className="hidden overflow-hidden rounded-lg border border-border sm:block" />
    </ReactFlow>
  );
}
