import { Position, getBezierPath } from "@xyflow/react";

import { ShapeOutline } from "@/components/canvas/shape-outline";
import { getNodeColorClasses } from "@/lib/canvas-colors";
import { CANVAS_SHAPES, getCanvasShape } from "@/lib/canvas-shapes";
import type { CanvasTemplate } from "@/lib/canvas-templates";
import type { CanvasNode } from "@/lib/canvas-types";
import { cn } from "@/lib/utils";

// Space around the diagram inside the preview, in canvas units.
const PREVIEW_PADDING = 24;

// Strokes stay this many screen pixels wide however far the preview is
// scaled down, so outlines and edges stay visible.
const NON_SCALING_STROKE = "[vector-effect:non-scaling-stroke]";

// A scaled-down drawing of a template's actual nodes and edges: the same
// shape outlines, node colors and bezier edges the canvas draws, fitted
// to the preview's box. Labels are left out; at this scale they would be
// too small to read.
export function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const nodesById = new Map(template.nodes.map((node) => [node.id, node]));
  const bounds = getBounds(template.nodes);
  // Template ids are plain slugs, so this is safe inside url(#...).
  const markerId = `template-preview-arrow-${template.id}`;

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="size-full"
      role="img"
      aria-label={`Preview of the ${template.name} template`}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={18}
          markerHeight={18}
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
        </marker>
      </defs>
      {template.edges.map((edge) => {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        if (!source || !target) return null;

        const sourcePosition = toPosition(edge.sourceHandle, Position.Right);
        const targetPosition = toPosition(edge.targetHandle, Position.Left);
        const sourcePoint = getHandlePoint(source, sourcePosition);
        const targetPoint = getHandlePoint(target, targetPosition);
        const [path] = getBezierPath({
          sourceX: sourcePoint.x,
          sourceY: sourcePoint.y,
          sourcePosition,
          targetX: targetPoint.x,
          targetY: targetPoint.y,
          targetPosition,
        });

        return (
          <path
            key={edge.id}
            d={path}
            markerEnd={`url(#${markerId})`}
            strokeWidth={1.25}
            className={cn("fill-none stroke-muted-foreground", NON_SCALING_STROKE)}
          />
        );
      })}
      {template.nodes.map((node) => {
        const shape = getCanvasShape(node.data.shape) ?? CANVAS_SHAPES[0];
        const { width, height } = getNodeSize(node);
        const color = getNodeColorClasses(node.data.color);

        return (
          <g key={node.id} transform={`translate(${node.position.x} ${node.position.y})`}>
            <ShapeOutline
              shape={shape.name}
              width={width}
              height={height}
              strokeWidth={1.25}
              className={cn(color.fill, color.stroke, NON_SCALING_STROKE)}
            />
          </g>
        );
      })}
    </svg>
  );
}

function getNodeSize(node: CanvasNode) {
  const shape = getCanvasShape(node.data.shape) ?? CANVAS_SHAPES[0];
  return { width: node.width ?? shape.width, height: node.height ?? shape.height };
}

// Template handle ids are the side names, which are Position's values.
function toPosition(handle: string | null | undefined, fallback: Position): Position {
  return Object.values(Position).find((position) => position === handle) ?? fallback;
}

// Where an edge attaches: the middle of the node's side.
function getHandlePoint(node: CanvasNode, position: Position) {
  const { width, height } = getNodeSize(node);
  const { x, y } = node.position;

  switch (position) {
    case Position.Top:
      return { x: x + width / 2, y };
    case Position.Right:
      return { x: x + width, y: y + height / 2 };
    case Position.Bottom:
      return { x: x + width / 2, y: y + height };
    case Position.Left:
      return { x, y: y + height / 2 };
  }
}

// The box around every node, plus padding.
function getBounds(nodes: CanvasNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { width, height } = getNodeSize(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  if (nodes.length === 0) {
    minX = minY = maxX = maxY = 0;
  }

  return {
    x: minX - PREVIEW_PADDING,
    y: minY - PREVIEW_PADDING,
    width: maxX - minX + PREVIEW_PADDING * 2,
    height: maxY - minY + PREVIEW_PADDING * 2,
  };
}
