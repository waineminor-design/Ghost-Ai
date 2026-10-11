// Node color keys and the design tokens they map to. Nodes store only the
// key in `data.color`; this is the one place a key becomes colors, so node
// data never holds hex values. The tokens live in app/globals.css.

type NodeColorClasses = {
  // Name shown to people (the color toolbar's swatch labels).
  label: string;
  // SVG fill and outline of the shape.
  fill: string;
  stroke: string;
  // Label text.
  text: string;
  // The color toolbar's swatch: the fill with the outline as its border.
  swatch: string;
};

// Toolbar order. Class names are written out in full so Tailwind finds
// them when it scans this file.
export const NODE_COLORS = {
  default: {
    label: "Default",
    fill: "fill-card",
    stroke: "stroke-input",
    text: "text-card-foreground",
    swatch: "bg-card border-input",
  },
  blue: {
    label: "Blue",
    fill: "fill-node-blue",
    stroke: "stroke-node-blue-border",
    text: "text-node-blue-foreground",
    swatch: "bg-node-blue border-node-blue-border",
  },
  green: {
    label: "Green",
    fill: "fill-node-green",
    stroke: "stroke-node-green-border",
    text: "text-node-green-foreground",
    swatch: "bg-node-green border-node-green-border",
  },
  purple: {
    label: "Purple",
    fill: "fill-node-purple",
    stroke: "stroke-node-purple-border",
    text: "text-node-purple-foreground",
    swatch: "bg-node-purple border-node-purple-border",
  },
  orange: {
    label: "Orange",
    fill: "fill-node-orange",
    stroke: "stroke-node-orange-border",
    text: "text-node-orange-foreground",
    swatch: "bg-node-orange border-node-orange-border",
  },
  red: {
    label: "Red",
    fill: "fill-node-red",
    stroke: "stroke-node-red-border",
    text: "text-node-red-foreground",
    swatch: "bg-node-red border-node-red-border",
  },
  yellow: {
    label: "Yellow",
    fill: "fill-node-yellow",
    stroke: "stroke-node-yellow-border",
    text: "text-node-yellow-foreground",
    swatch: "bg-node-yellow border-node-yellow-border",
  },
  teal: {
    label: "Teal",
    fill: "fill-node-teal",
    stroke: "stroke-node-teal-border",
    text: "text-node-teal-foreground",
    swatch: "bg-node-teal border-node-teal-border",
  },
} as const satisfies Record<string, NodeColorClasses>;

export type NodeColor = keyof typeof NODE_COLORS;

export const DEFAULT_NODE_COLOR: NodeColor = "default";

export function isNodeColor(value: unknown): value is NodeColor {
  return typeof value === "string" && Object.hasOwn(NODE_COLORS, value);
}

// Unknown keys (e.g. written by a newer client) fall back to the default.
export function getNodeColorClasses(color: string): NodeColorClasses {
  return NODE_COLORS[isNodeColor(color) ? color : DEFAULT_NODE_COLOR];
}
