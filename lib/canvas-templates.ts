import type { NodeColor } from "@/lib/canvas-colors";
import {
  SHAPE_NODE_TYPE,
  getCanvasShape,
  type CanvasShape,
} from "@/lib/canvas-shapes";
import {
  LABELED_EDGE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/lib/canvas-types";

// The starter template library. Templates are ordinary canvas nodes and
// edges (lib/canvas-types.ts) using the shape names from canvas-shapes.ts
// and the color keys from canvas-colors.ts, so importing one is just
// writing them into room storage.

export type CanvasTemplate = {
  id: string;
  name: string;
  // One line, shown under the name in the templates dialog.
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

// Node handle ids are the side they sit on (see shape-node.tsx).
type HandleSide = "top" | "right" | "bottom" | "left";

// Templates read left to right: columns COLUMN_GAP apart, nodes placed by
// their center so different shapes in a column line up.
const COLUMN_GAP = 280;

function node(
  id: string,
  label: string,
  shape: CanvasShape,
  color: NodeColor,
  column: number,
  centerY: number,
): CanvasNode {
  // Every shape name passed here is a CanvasShape, so the lookup can't
  // miss; the fallback size only keeps the type total.
  const { width, height } = getCanvasShape(shape) ?? { width: 160, height: 80 };
  return {
    id,
    type: SHAPE_NODE_TYPE,
    position: {
      x: column * COLUMN_GAP - width / 2,
      y: centerY - height / 2,
    },
    data: { label, shape, color },
    width,
    height,
  };
}

// Edges leave a node's right side and enter the next node's left side
// unless the layout needs another side (e.g. a node directly below).
function edge(
  source: string,
  target: string,
  label: string,
  sourceHandle: HandleSide = "right",
  targetHandle: HandleSide = "left",
): CanvasEdge {
  return {
    id: `${source}->${target}`,
    type: LABELED_EDGE_TYPE,
    source,
    target,
    sourceHandle,
    targetHandle,
    data: { label },
  };
}

// Colors follow one convention across templates: clients and producers
// blue, gateways and routing purple, services green, storage orange,
// queues and checks yellow, environments teal, external systems and
// failure paths red.
export const CANVAS_TEMPLATES: readonly CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "An API gateway routing to independent services, each with its own database, talking through a message queue.",
    nodes: [
      node("clients", "Clients", "circle", "blue", 0, 0),
      node("gateway", "API Gateway", "diamond", "purple", 1, 0),
      node("auth", "Auth Service", "rectangle", "green", 2, -180),
      node("orders", "Order Service", "rectangle", "green", 2, 0),
      node("payments", "Payment Service", "rectangle", "green", 2, 180),
      node("users-db", "Users DB", "cylinder", "orange", 3, -180),
      node("orders-db", "Orders DB", "cylinder", "orange", 3, 0),
      node("queue", "Message Queue", "pill", "yellow", 3, 180),
      node("notifications", "Notification Service", "rectangle", "green", 4, 180),
      node("email", "Email Provider", "hexagon", "red", 5, 180),
    ],
    edges: [
      edge("clients", "gateway", "HTTPS"),
      edge("gateway", "auth", "/auth"),
      edge("gateway", "orders", "/orders"),
      edge("gateway", "payments", "/payments"),
      edge("auth", "users-db", "read/write"),
      edge("orders", "orders-db", "read/write"),
      edge("orders", "queue", "order.created"),
      edge("payments", "queue", "payment.done"),
      edge("queue", "notifications", "consume"),
      edge("notifications", "email", "send"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD pipeline",
    description:
      "Code moves from the repository through build, test and a quality gate to staging and then production.",
    nodes: [
      node("developer", "Developer", "circle", "blue", 0, 0),
      node("repo", "Git Repository", "cylinder", "purple", 1, 0),
      node("build", "Build", "rectangle", "green", 2, 0),
      node("test", "Test", "rectangle", "green", 3, 0),
      node("gate", "Quality Gate", "diamond", "yellow", 4, 0),
      node("registry", "Artifact Registry", "cylinder", "orange", 5, -100),
      node("notify", "Notify Team", "hexagon", "red", 5, 140),
      node("staging", "Staging", "rectangle", "teal", 6, -220),
      node("production", "Production", "rectangle", "teal", 6, 20),
    ],
    edges: [
      edge("developer", "repo", "push"),
      edge("repo", "build", "webhook"),
      edge("build", "test", "artifact"),
      edge("test", "gate", "results"),
      edge("gate", "registry", "pass"),
      edge("gate", "notify", "fail"),
      edge("registry", "staging", "deploy"),
      edge("staging", "production", "promote", "bottom", "top"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-driven system",
    description:
      "Producers publish events to a central bus; independent consumers react to them and write to their own storage.",
    nodes: [
      node("web", "Web App", "rectangle", "blue", 0, -180),
      node("mobile", "Mobile App", "rectangle", "blue", 0, 0),
      node("devices", "IoT Devices", "hexagon", "blue", 0, 180),
      node("bus", "Event Bus", "pill", "purple", 1, 0),
      node("dead-letters", "Dead Letter Queue", "pill", "red", 1, 200),
      node("email-worker", "Email Worker", "rectangle", "green", 2, -180),
      node("analytics-worker", "Analytics Worker", "rectangle", "green", 2, 0),
      node("inventory-worker", "Inventory Worker", "rectangle", "green", 2, 180),
      node("email", "Email Provider", "hexagon", "red", 3, -180),
      node("warehouse", "Data Warehouse", "cylinder", "orange", 3, 0),
      node("inventory-db", "Inventory DB", "cylinder", "orange", 3, 180),
    ],
    edges: [
      edge("web", "bus", "user.signup"),
      edge("mobile", "bus", "order.placed"),
      edge("devices", "bus", "telemetry"),
      edge("bus", "dead-letters", "failed", "bottom", "top"),
      edge("bus", "email-worker", "user.*"),
      edge("bus", "analytics-worker", "all events"),
      edge("bus", "inventory-worker", "order.*"),
      edge("email-worker", "email", "send"),
      edge("analytics-worker", "warehouse", "load"),
      edge("inventory-worker", "inventory-db", "update"),
    ],
  },
  {
    id: "three-tier-web-app",
    name: "Three-tier web app",
    description:
      "A browser client, a load-balanced API tier, and a data tier with a cache in front of the database.",
    nodes: [
      node("browser", "Browser", "circle", "blue", 0, 0),
      node("cdn", "CDN", "hexagon", "purple", 1, -200),
      node("load-balancer", "Load Balancer", "diamond", "purple", 1, 0),
      node("object-storage", "Object Storage", "cylinder", "orange", 2, -200),
      node("api", "API Server", "rectangle", "green", 2, 0),
      node("auth", "Auth Provider", "hexagon", "red", 3, -200),
      node("cache", "Redis Cache", "pill", "yellow", 3, 0),
      node("database", "PostgreSQL", "cylinder", "orange", 3, 200),
      node("replica", "Read Replica", "cylinder", "orange", 4, 200),
    ],
    edges: [
      edge("browser", "cdn", "static assets"),
      edge("browser", "load-balancer", "HTTPS"),
      edge("cdn", "object-storage", "origin"),
      edge("load-balancer", "api", "forward"),
      edge("api", "auth", "verify token"),
      edge("api", "cache", "get/set"),
      edge("api", "database", "SQL"),
      edge("database", "replica", "replicate"),
    ],
  },
];

// Copies a template with fresh unique node and edge ids, so it can be
// imported any number of times (by anyone in the room) without clashing
// with ids already in storage. Edges are rewired to the new node ids.
export function instantiateTemplate(template: CanvasTemplate): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const nodeIds = new Map(
    template.nodes.map((templateNode) => [templateNode.id, freshId(templateNode.id)]),
  );
  const newNodeId = (id: string) => nodeIds.get(id) ?? freshId(id);

  return {
    nodes: template.nodes.map((templateNode) => ({
      ...templateNode,
      id: newNodeId(templateNode.id),
      position: { ...templateNode.position },
      data: { ...templateNode.data },
    })),
    edges: template.edges.map((templateEdge) => ({
      ...templateEdge,
      id: freshId(templateEdge.id),
      source: newNodeId(templateEdge.source),
      target: newNodeId(templateEdge.target),
      data: { label: templateEdge.data?.label ?? "" },
    })),
  };
}

function freshId(base: string) {
  return `${base}-${crypto.randomUUID()}`;
}
