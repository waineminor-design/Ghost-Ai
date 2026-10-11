// The canvas shape list. The shape panel and the shape node renderer both
// read it, so a shape's name, label and default size live only here.

export type CanvasShapeDefinition = {
  name: string;
  label: string;
  // What the shape usually stands for in an architecture diagram.
  description: string;
  // Default node size in canvas units.
  width: number;
  height: number;
};

export const CANVAS_SHAPES = [
  {
    name: "rectangle",
    label: "Rectangle",
    description: "Component or service",
    width: 160,
    height: 80,
  },
  {
    name: "diamond",
    label: "Diamond",
    description: "Decision or gateway",
    width: 120,
    height: 120,
  },
  {
    name: "circle",
    label: "Circle",
    description: "Event or endpoint",
    width: 100,
    height: 100,
  },
  {
    name: "pill",
    label: "Pill",
    description: "Process or queue",
    width: 160,
    height: 64,
  },
  {
    name: "cylinder",
    label: "Cylinder",
    description: "Database or storage",
    width: 120,
    height: 100,
  },
  {
    name: "hexagon",
    label: "Hexagon",
    description: "External system",
    width: 160,
    height: 90,
  },
] as const satisfies readonly CanvasShapeDefinition[];

// Smallest size a node can be resized to, so it never collapses.
export const MIN_NODE_WIDTH = 60;
export const MIN_NODE_HEIGHT = 40;

export type CanvasShape = (typeof CANVAS_SHAPES)[number]["name"];

// The React Flow node type that renders every shape.
export const SHAPE_NODE_TYPE = "shape";

export function isCanvasShape(value: unknown): value is CanvasShape {
  return CANVAS_SHAPES.some((shape) => shape.name === value);
}

export function getCanvasShape(
  name: string,
): (typeof CANVAS_SHAPES)[number] | undefined {
  return CANVAS_SHAPES.find((shape) => shape.name === name);
}

// Dragging a shape from the panel onto the canvas: the panel writes this
// payload as JSON under SHAPE_DRAG_MIME, the canvas reads it on drop.
export const SHAPE_DRAG_MIME = "application/ghost-shape";

export type ShapeDragPayload = {
  shape: CanvasShape;
  width: number;
  height: number;
};

// Returns null for anything that isn't a valid shape payload (another
// app's drag, a file, malformed JSON), so the canvas can ignore it.
export function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  const { shape, width, height } = value as Record<string, unknown>;

  if (!isCanvasShape(shape) || !isPositiveSize(width) || !isPositiveSize(height)) {
    return null;
  }

  return { shape, width, height };
}

function isPositiveSize(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
