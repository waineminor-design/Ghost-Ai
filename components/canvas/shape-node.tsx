import { Handle, Position, type NodeProps } from "@xyflow/react";

import { ShapeOutline } from "@/components/canvas/shape-outline";
import { getNodeColorClasses } from "@/lib/canvas-colors";
import type { CanvasNode } from "@/lib/canvas-types";
import { CANVAS_SHAPES, getCanvasShape } from "@/lib/canvas-shapes";
import { cn } from "@/lib/utils";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

// The one custom node type on the canvas. Draws the node's shape as an SVG
// outline sized to the node, with the label centered on top and a
// connection handle on each side. Unknown shapes render as rectangles.
export function ShapeNode({ data, selected, width, height }: NodeProps<CanvasNode>) {
  const shape = getCanvasShape(data.shape) ?? CANVAS_SHAPES[0];
  const nodeWidth = width ?? shape.width;
  const nodeHeight = height ?? shape.height;
  const color = getNodeColorClasses(data.color);

  return (
    <div className="group relative size-full">
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
      {data.label ? (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4 text-center text-sm break-words",
            color.text,
          )}
        >
          {data.label}
        </div>
      ) : null}
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
