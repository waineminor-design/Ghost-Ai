import { useRef, type DragEvent } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";

import { CanvasControls } from "@/components/canvas/canvas-controls";
import { LabeledEdge } from "@/components/canvas/labeled-edge";
import { ShapeNode } from "@/components/canvas/shape-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import { TemplatesDialog } from "@/components/canvas/templates-dialog";
import { useCanvasShortcuts } from "@/hooks/use-canvas-shortcuts";
import { useTemplateImport } from "@/hooks/use-template-import";
import { DEFAULT_NODE_COLOR } from "@/lib/canvas-colors";
import {
  SHAPE_DRAG_MIME,
  SHAPE_NODE_TYPE,
  parseShapeDragPayload,
  type ShapeDragPayload,
} from "@/lib/canvas-shapes";
import {
  LABELED_EDGE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/lib/canvas-types";

// Defined once, outside the component: React Flow re-mounts every node
// when this object changes identity.
const NODE_TYPES: NodeTypes = { [SHAPE_NODE_TYPE]: ShapeNode };
const EDGE_TYPES: EdgeTypes = { [LABELED_EDGE_TYPE]: LabeledEdge };

// Merged into every new connection before it reaches the Liveblocks flow's
// onConnect, so new edges are labeled edges with an empty label.
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: LABELED_EDGE_TYPE,
  data: { label: "" },
};

// Either key deletes the selected nodes and edges. React Flow ignores it
// while a text field (e.g. a label editor) has focus.
const DELETE_KEYS = ["Delete", "Backspace"];

// No edges from a node to itself.
function isNotSelfConnection(connection: CanvasEdge | Connection) {
  return connection.source !== connection.target;
}

// The shared React Flow canvas. Nodes and edges live in the room's
// Liveblocks storage, so every change syncs to everyone in the room.
// Theme colors come from the --xy-* token mapping in app/globals.css.
// Also renders the templates dialog, since importing writes to the room.
// Must render inside a RoomProvider, a Suspense boundary and EditorShell.
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
  useCanvasShortcuts();
  const importTemplate = useTemplateImport({ onNodesChange, onEdgesChange });
  const containerRef = useRef<HTMLDivElement>(null);
  // Orders this client's own nodes; the random part keeps ids unique
  // across clients that add the same shape in the same millisecond.
  const addCounter = useRef(0);

  // Adds a shape node centered on `screenPoint`. It goes through the
  // Liveblocks flow, so it appears for everyone in the room.
  function addShapeAt(
    payload: ShapeDragPayload,
    screenPoint: { x: number; y: number },
  ) {
    const center = screenToFlowPosition(screenPoint);
    addCounter.current += 1;

    const node: CanvasNode = {
      id: `${payload.shape}-${Date.now()}-${addCounter.current}-${crypto.randomUUID().slice(0, 8)}`,
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

  // Click, tap or keyboard on a panel button: add the shape in the middle
  // of the visible canvas (the non-drag way to create shapes).
  function addShapeAtViewportCenter(payload: ShapeDragPayload) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    addShapeAt(payload, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  // Without preventDefault here the browser never fires `drop`.
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  // A shape dropped from the panel becomes a node centered on the drop
  // point.
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const payload = parseShapeDragPayload(
      event.dataTransfer.getData(SHAPE_DRAG_MIME),
    );
    if (!payload) return;

    addShapeAt(payload, { x: event.clientX, y: event.clientY });
  }

  return (
    <div ref={containerRef} className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        isValidConnection={isNotSelfConnection}
        deleteKeyCode={DELETE_KEYS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Removes deleted nodes, their connected edges and deleted edges
        // from room storage.
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} />
        <ShapePanel onAddShape={addShapeAtViewportCenter} />
        <CanvasControls />
      </ReactFlow>
      {/* Outside <ReactFlow>: the dialog is portaled, but React events
          still bubble through the React tree. */}
      <TemplatesDialog
        isCanvasEmpty={nodes.length === 0 && edges.length === 0}
        onImport={importTemplate}
      />
    </div>
  );
}
