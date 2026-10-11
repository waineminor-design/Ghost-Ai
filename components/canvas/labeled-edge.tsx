import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { LabelEditor } from "@/components/canvas/label-editor";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";
import { cn } from "@/lib/utils";

// Width of the invisible stroke along the path that takes clicks, so a thin
// edge is still easy to hit.
const EDGE_HIT_WIDTH = 24;

// Shared by the read-only label and the label editor, so the text doesn't
// move when editing starts.
const EDGE_LABEL_TEXT_CLASSES =
  "max-w-48 text-center text-xs break-words whitespace-pre-wrap";

// The canvas's edge type. A bezier curve that leaves and enters through the
// handles the connection used, with an arrowhead at the target and a wide
// invisible hit area. Colors come from the --xy-edge-* token mapping in
// app/globals.css. Double-click edits the label shown at the midpoint;
// label changes go through the Liveblocks flow, so they sync to the room.
export function LabeledEdge({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  const label = data?.label ?? "";
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  // One marker per edge, so the arrowhead can follow the edge's selected
  // color. Edge ids are only made safe for use inside url(#...).
  const markerId = `edge-arrow-${id.replace(/[^\w-]/g, "_")}`;

  // `nextLabel` is null when the edit was cancelled; the stored label was
  // never touched, so there is nothing to restore.
  function finishEditing(nextLabel: string | null) {
    setIsEditing(false);
    if (nextLabel !== null && nextLabel !== label) {
      updateEdgeData(id, { label: nextLabel });
    }
  }

  return (
    <>
      <g onDoubleClick={() => setIsEditing(true)}>
        <defs>
          {/* Sized in canvas units, so the thicker selected stroke doesn't
              enlarge the arrowhead. */}
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={10}
            markerHeight={10}
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className={
                selected
                  ? "fill-(--xy-edge-stroke-selected)"
                  : "fill-(--xy-edge-stroke)"
              }
            />
          </marker>
        </defs>
        <BaseEdge
          id={id}
          path={path}
          markerEnd={`url(#${markerId})`}
          interactionWidth={EDGE_HIT_WIDTH}
          style={{ ...style, strokeWidth: selected ? 2.5 : 1.5 }}
        />
      </g>
      {isEditing || label ? (
        <EdgeLabelRenderer>
          {/* The label layer ignores the pointer by default; this box takes
              clicks (selecting the edge) and double-clicks (editing).
              nopan / nodrag keep presses on it from moving the canvas. */}
          <div
            className={cn(
              "nodrag nopan pointer-events-auto absolute top-0 left-0 rounded-md border border-border bg-card px-2 py-1 text-card-foreground shadow-sm",
              isEditing && "min-w-12",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onDoubleClick={() => setIsEditing(true)}
          >
            {isEditing ? (
              <LabelEditor
                initialLabel={label}
                className={EDGE_LABEL_TEXT_CLASSES}
                ariaLabel="Edge label"
                onDone={finishEditing}
              />
            ) : (
              <div className={EDGE_LABEL_TEXT_CLASSES}>{label}</div>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
