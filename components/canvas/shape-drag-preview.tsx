import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { ShapeOutline } from "@/components/canvas/shape-outline";
import { DEFAULT_NODE_COLOR, getNodeColorClasses } from "@/lib/canvas-colors";
import type { ShapeDragPayload } from "@/lib/canvas-shapes";
import { cn } from "@/lib/utils";

// The preview is the node's outline at this fraction of its default size.
const PREVIEW_SCALE = 0.6;
// Space around the outline so its stroke isn't cut off at the image edge.
const PREVIEW_PADDING = 2;

// Replaces the browser's default drag ghost (a picture of the panel
// button) with an outline of the shape being dragged, centered on the
// cursor like the node will be centered on the drop point. Call from a
// dragstart handler.
export function setShapeDragImage(
  dataTransfer: DataTransfer,
  payload: ShapeDragPayload,
) {
  const width = payload.width * PREVIEW_SCALE;
  const height = payload.height * PREVIEW_SCALE;
  const color = getNodeColorClasses(DEFAULT_NODE_COLOR);

  // The browser takes the drag image from an element in the page, so the
  // preview is rendered off-screen for the moment the drag starts.
  const container = document.createElement("div");
  container.className = "pointer-events-none fixed -top-[9999px] -left-[9999px]";
  document.body.append(container);

  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <svg
        className="block"
        width={width + PREVIEW_PADDING * 2}
        height={height + PREVIEW_PADDING * 2}
        viewBox={`${-PREVIEW_PADDING} ${-PREVIEW_PADDING} ${width + PREVIEW_PADDING * 2} ${height + PREVIEW_PADDING * 2}`}
        aria-hidden
      >
        {/* Primary stroke (as on a selected node): the default node stroke
            is too faint once the browser fades the drag image. */}
        <ShapeOutline
          shape={payload.shape}
          width={width}
          height={height}
          className={cn(color.fill, "stroke-primary")}
          strokeWidth={1.5}
        />
      </svg>,
    );
  });

  dataTransfer.setDragImage(
    container,
    width / 2 + PREVIEW_PADDING,
    height / 2 + PREVIEW_PADDING,
  );

  // The browser captures the image when dragstart returns, so the element
  // can go on the next task.
  setTimeout(() => {
    root.unmount();
    container.remove();
  });
}
