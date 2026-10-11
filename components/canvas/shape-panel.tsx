import type { DragEvent } from "react";
import { Panel } from "@xyflow/react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";

import {
  CANVAS_SHAPES,
  SHAPE_DRAG_MIME,
  type CanvasShape,
  type ShapeDragPayload,
} from "@/lib/canvas-shapes";

const SHAPE_ICONS: Record<CanvasShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

// Floating toolbar at the bottom of the canvas. Drag a shape button onto
// the canvas to place it, or click/tap/press it to add the shape in the
// middle of the view. Must render inside <ReactFlow>.
export function ShapePanel({
  onAddShape,
}: {
  onAddShape: (payload: ShapeDragPayload) => void;
}) {
  return (
    <Panel
      position="bottom-center"
      role="group"
      aria-label="Shapes"
      className="flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg"
    >
      {CANVAS_SHAPES.map((shape) => {
        const Icon = SHAPE_ICONS[shape.name];
        const label = `Add ${shape.label.toLowerCase()}: ${shape.description.toLowerCase()}`;
        const payload: ShapeDragPayload = {
          shape: shape.name,
          width: shape.width,
          height: shape.height,
        };

        return (
          <button
            key={shape.name}
            type="button"
            draggable
            onDragStart={(event) => startShapeDrag(event, payload)}
            onClick={() => onAddShape(payload)}
            aria-label={label}
            title={label}
            className="flex size-9 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <Icon className="size-5" aria-hidden />
          </button>
        );
      })}
    </Panel>
  );
}

function startShapeDrag(event: DragEvent<HTMLElement>, payload: ShapeDragPayload) {
  event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "move";
}
