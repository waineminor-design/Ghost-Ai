// Node color keys and the design tokens they map to. Nodes store only the
// key in `data.color`; this is the one place a key becomes colors, so node
// data never holds hex values.

type NodeColorClasses = {
  // SVG fill and outline of the shape.
  fill: string;
  stroke: string;
  // Label text.
  text: string;
};

export const NODE_COLORS = {
  default: {
    fill: "fill-card",
    stroke: "stroke-input",
    text: "text-card-foreground",
  },
} as const satisfies Record<string, NodeColorClasses>;

export type NodeColor = keyof typeof NODE_COLORS;

export const DEFAULT_NODE_COLOR: NodeColor = "default";

// Unknown keys (e.g. written by a newer client) fall back to the default.
export function getNodeColorClasses(color: string): NodeColorClasses {
  return Object.hasOwn(NODE_COLORS, color)
    ? NODE_COLORS[color as NodeColor]
    : NODE_COLORS[DEFAULT_NODE_COLOR];
}
