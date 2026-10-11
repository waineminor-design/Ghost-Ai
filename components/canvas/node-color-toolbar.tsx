import { NodeToolbar, Position } from "@xyflow/react";
import { Check } from "lucide-react";

import { NODE_COLORS, type NodeColor } from "@/lib/canvas-colors";
import { cn } from "@/lib/utils";

const NODE_COLOR_KEYS = Object.keys(NODE_COLORS) as NodeColor[];

type NodeColorToolbarProps = {
  currentColor: NodeColor;
  onSelectColor: (color: NodeColor) => void;
};

// One round swatch per node color, floating above the node. React Flow's
// NodeToolbar shows it only while this node is the single selected node.
// Must render inside a custom node.
export function NodeColorToolbar({ currentColor, onSelectColor }: NodeColorToolbarProps) {
  return (
    <NodeToolbar
      position={Position.Top}
      role="group"
      aria-label="Node color"
      // nopan: pressing a swatch doesn't pan the canvas. nokey: keys pressed
      // on a swatch (Space, arrows, Backspace) don't pan, move or delete
      // the node.
      className="nopan nokey flex items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-lg"
    >
      {NODE_COLOR_KEYS.map((key) => {
        const color = NODE_COLORS[key];
        const isCurrent = key === currentColor;

        return (
          <button
            key={key}
            type="button"
            aria-label={color.label}
            aria-pressed={isCurrent}
            title={color.label}
            onClick={() => onSelectColor(key)}
            className="flex size-8 items-center justify-center rounded-full transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 items-center justify-center rounded-full border",
                color.swatch,
              )}
            >
              {isCurrent ? (
                <Check className={cn("size-3", color.text)} strokeWidth={3} />
              ) : null}
            </span>
          </button>
        );
      })}
    </NodeToolbar>
  );
}
