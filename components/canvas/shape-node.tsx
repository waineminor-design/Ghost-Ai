import { useState } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";

import { NodeLabelEditor } from "@/components/canvas/node-label-editor";
import { ShapeOutline } from "@/components/canvas/shape-outline";
import { getNodeColorClasses } from "@/lib/canvas-colors";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";
import {
  CANVAS_SHAPES,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  getCanvasShape,
} from "@/lib/canvas-shapes";
import { cn } from "@/lib/utils";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

// Shared by the read-only label and the label editor, so the text sits in
// the same place whether or not it is being edited. Wraps inside the node;
// the wrapper clips anything taller than the node.
const LABEL_TEXT_CLASSES =
  "m-auto max-w-full text-center text-sm break-words whitespace-pre-wrap";

// The one custom node type on the canvas. Draws the node's shape as an SVG
// outline sized to the node, with the label centered on top and a
// connection handle on each side. Unknown shapes render as rectangles.
// Selected nodes can be resized; double-click edits the label. Size and
// label changes go through the Liveblocks flow, so they sync to the room.
export function ShapeNode({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  const shape = getCanvasShape(data.shape) ?? CANVAS_SHAPES[0];
  const nodeWidth = width ?? shape.width;
  const nodeHeight = height ?? shape.height;
  const color = getNodeColorClasses(data.color);

  // `label` is null when the edit was cancelled; the stored label was never
  // touched, so there is nothing to restore.
  function finishEditing(label: string | null) {
    setIsEditing(false);
    if (label !== null && label !== data.label) {
      updateNodeData(id, { label });
    }
  }

  return (
    <div
      className="group relative size-full"
      onDoubleClick={() => setIsEditing(true)}
    >
      <svg
        className="absolute inset-0 overflow-visible"
        width={nodeWidth}
        height={nodeHeight}
        aria-hidden
      >
        <ShapeOutline
          shape={shape.name}
          width={nodeWidth}
          height={nodeHeight}
          className={cn(
            color.fill,
            selected ? "stroke-primary" : color.stroke,
          )}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      {isEditing || data.label ? (
        <div
          className={cn(
            "absolute inset-0 flex overflow-hidden p-4",
            color.text,
          )}
        >
          {isEditing ? (
            <NodeLabelEditor
              initialLabel={data.label}
              className={LABEL_TEXT_CLASSES}
              onDone={finishEditing}
            />
          ) : (
            <div className={LABEL_TEXT_CLASSES}>{data.label}</div>
          )}
        </div>
      ) : null}
      {/* Sides resize one dimension, corners both. Rendered before the
          connection handles so the handles stay on top where they meet.
          The ::before widens each 1px side line into a grabbable strip. */}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        lineClassName="before:absolute before:-inset-1"
      />
      {HANDLE_POSITIONS.map((position) => (
        // Source handles on every side; the canvas uses loose connection
        // mode, so any handle can connect to any other.
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className={cn(
            "size-2 rounded-full border border-background opacity-0 transition-opacity group-hover:opacity-100",
            selected && "opacity-100",
          )}
        />
      ))}
    </div>
  );
}
