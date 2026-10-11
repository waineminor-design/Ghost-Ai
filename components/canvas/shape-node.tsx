import { Handle, Position, type NodeProps } from "@xyflow/react";

import { getNodeColorClasses } from "@/lib/canvas-colors";
import type { CanvasNode } from "@/lib/canvas-types";
import { CANVAS_SHAPES, getCanvasShape, type CanvasShape } from "@/lib/canvas-shapes";
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

type ShapeOutlineProps = {
  shape: CanvasShape;
  width: number;
  height: number;
  className: string;
  strokeWidth: number;
};

function ShapeOutline({ shape, width: w, height: h, ...paint }: ShapeOutlineProps) {
  switch (shape) {
    case "rectangle":
      return <rect width={w} height={h} rx={8} {...paint} />;
    case "diamond":
      return (
        <polygon
          points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
          {...paint}
        />
      );
    case "circle":
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...paint} />;
    case "pill":
      return <rect width={w} height={h} rx={Math.min(w, h) / 2} {...paint} />;
    case "cylinder": {
      // Body with a rounded bottom, plus the front edge of the lid.
      const ry = Math.min(12, h / 4);
      return (
        <>
          <path
            d={`M0,${ry} L0,${h - ry} A${w / 2},${ry} 0 0 0 ${w},${h - ry} L${w},${ry} A${w / 2},${ry} 0 0 0 0,${ry} Z`}
            {...paint}
          />
          <path
            d={`M0,${ry} A${w / 2},${ry} 0 0 0 ${w},${ry}`}
            {...paint}
            className={cn(paint.className, "fill-none")}
          />
        </>
      );
    }
    case "hexagon": {
      const inset = Math.min(w / 4, h / 2);
      return (
        <polygon
          points={`${inset},0 ${w - inset},0 ${w},${h / 2} ${w - inset},${h} ${inset},${h} 0,${h / 2}`}
          {...paint}
        />
      );
    }
  }
}
