import type { MutableFlow } from "@liveblocks/react-flow/node";

import { isNodeColor } from "@/lib/canvas-colors";
import {
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  NODE_HANDLE_SIDES,
  SHAPE_NODE_TYPE,
  getCanvasShape,
  type NodeHandleSide,
} from "@/lib/canvas-shapes";
import {
  LABELED_EDGE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/lib/canvas-types";
import type { DesignAgentToolCall } from "@/lib/design-agent-tools";

// Validates the design agent's tool calls against the canvas as it is now
// and applies the valid ones to the flow. Runs inside one mutateFlow()
// callback, so everything applied here is a single storage mutation.

type ToolName = DesignAgentToolCall["toolName"];

export type SkippedAction = {
  toolName: string;
  reason: string;
};

export type ApplyResult = {
  // Number of actions applied, and how many of each kind.
  applied: number;
  appliedByTool: Partial<Record<ToolName, number>>;
  skipped: SkippedAction[];
};

type Flow = MutableFlow<CanvasNode, CanvasEdge>;

// addNode calls are applied first, so every other call can reference a
// node created in the same response no matter where the model put it.
// The rest are applied in the order the model made them.
export function applyDesignActions(flow: Flow, calls: DesignAgentToolCall[]): ApplyResult {
  const result: ApplyResult = { applied: 0, appliedByTool: {}, skipped: [] };
  // addNode key -> the new node's canvas id.
  const keys = new Map<string, string>();

  const ordered = [
    ...calls.filter((call) => call.toolName === "addNode"),
    ...calls.filter((call) => call.toolName !== "addNode"),
  ];

  ordered.forEach((call, index) => {
    const reason = applyAction(flow, call, keys, index);
    if (reason) {
      result.skipped.push({ toolName: call.toolName, reason });
      return;
    }
    result.applied += 1;
    result.appliedByTool[call.toolName] = (result.appliedByTool[call.toolName] ?? 0) + 1;
  });

  return result;
}

// Applies one action; returns why it was skipped, or null once applied.
function applyAction(
  flow: Flow,
  call: DesignAgentToolCall,
  keys: Map<string, string>,
  index: number,
): string | null {
  // An existing node id, or the id of a node added under that key in this
  // response; undefined if neither exists (any more).
  const resolve = (reference: string) => {
    const id = keys.get(reference) ?? reference;
    return flow.getNode(id) ? id : undefined;
  };

  switch (call.toolName) {
    case "addNode": {
      const { key, shape, label, color, x, y } = call.input;
      if (!key) return "empty key";
      if (keys.has(key)) return `key "${key}" used twice`;
      // A key equal to an existing id would make references ambiguous.
      if (flow.getNode(key)) return `key "${key}" is an existing node id`;
      const shapeDefinition = getCanvasShape(shape);
      if (!shapeDefinition) return `unknown shape "${shape}"`;
      if (!isNodeColor(color)) return `unknown color "${color}"`;
      if (!isFiniteNumber(x) || !isFiniteNumber(y)) return "invalid position";
      const width = call.input.width ?? shapeDefinition.width;
      const height = call.input.height ?? shapeDefinition.height;
      const sizeError = checkSize(width, height);
      if (sizeError) return sizeError;

      const id = newNodeId(shape, index);
      keys.set(key, id);
      flow.addNode({
        id,
        type: SHAPE_NODE_TYPE,
        position: { x, y },
        data: { label: label.trim(), shape, color },
        width,
        height,
      });
      return null;
    }

    case "updateNode": {
      const id = resolve(call.input.node);
      if (!id) return `unknown node "${call.input.node}"`;
      const { label, color } = call.input;
      if (label === undefined && color === undefined) return "nothing to update";
      if (color !== undefined && !isNodeColor(color)) return `unknown color "${color}"`;
      flow.updateNodeData(id, {
        ...(label !== undefined && { label: label.trim() }),
        ...(color !== undefined && { color }),
      });
      return null;
    }

    case "moveNode": {
      const id = resolve(call.input.node);
      if (!id) return `unknown node "${call.input.node}"`;
      const { x, y } = call.input;
      if (!isFiniteNumber(x) || !isFiniteNumber(y)) return "invalid position";
      flow.updateNode(id, { position: { x, y } });
      return null;
    }

    case "resizeNode": {
      const id = resolve(call.input.node);
      if (!id) return `unknown node "${call.input.node}"`;
      const { width, height } = call.input;
      const sizeError = checkSize(width, height);
      if (sizeError) return sizeError;
      flow.updateNode(id, { width, height });
      return null;
    }

    case "deleteNode": {
      const id = resolve(call.input.node);
      if (!id) return `unknown node "${call.input.node}"`;
      // Like deleting on the canvas: the node's edges go with it.
      flow.removeEdges(
        flow.edges
          .filter((edge) => edge.source === id || edge.target === id)
          .map((edge) => edge.id),
      );
      flow.removeNode(id);
      return null;
    }

    case "addEdge": {
      const source = resolve(call.input.source);
      if (!source) return `unknown source node "${call.input.source}"`;
      const target = resolve(call.input.target);
      if (!target) return `unknown target node "${call.input.target}"`;
      // The canvas doesn't allow an edge from a node to itself either.
      if (source === target) return "edge from a node to itself";
      const sourceHandle = call.input.sourceHandle ?? "right";
      const targetHandle = call.input.targetHandle ?? "left";
      if (!isHandleSide(sourceHandle) || !isHandleSide(targetHandle)) {
        return "unknown handle";
      }

      // React Flow's id for a connection (what the canvas's onConnect
      // uses), so the same connection can't be added twice.
      const id = `xy-edge__${source}${sourceHandle}-${target}${targetHandle}`;
      if (flow.getEdge(id)) return "connection already exists";
      flow.addEdge({
        id,
        type: LABELED_EDGE_TYPE,
        source,
        target,
        sourceHandle,
        targetHandle,
        data: { label: call.input.label?.trim() ?? "" },
      });
      return null;
    }

    case "updateEdge": {
      const { edge, label } = call.input;
      if (!flow.getEdge(edge)) return `unknown edge "${edge}"`;
      flow.updateEdgeData(edge, { label: label.trim() });
      return null;
    }

    case "deleteEdge": {
      const { edge } = call.input;
      if (!flow.getEdge(edge)) return `unknown edge "${edge}"`;
      flow.removeEdge(edge);
      return null;
    }
  }
}

// Same id style as nodes added on the canvas: shape, time, a per-run
// counter and a random part.
function newNodeId(shape: string, index: number) {
  return `${shape}-${Date.now()}-${index + 1}-${crypto.randomUUID().slice(0, 8)}`;
}

function checkSize(width: number, height: number): string | null {
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) return "invalid size";
  if (width < MIN_NODE_WIDTH || height < MIN_NODE_HEIGHT) {
    return `size below the ${MIN_NODE_WIDTH}x${MIN_NODE_HEIGHT} minimum`;
  }
  return null;
}

function isHandleSide(value: string): value is NodeHandleSide {
  return (NODE_HANDLE_SIDES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// "Added 5 nodes and 4 edges, moved 1 node. Skipped 1 invalid action."
export function describeChanges({ applied, appliedByTool, skipped }: ApplyResult): string {
  const parts = (
    [
      ["addNode", "added", "node"],
      ["addEdge", "added", "edge"],
      ["updateNode", "updated", "node"],
      ["moveNode", "moved", "node"],
      ["resizeNode", "resized", "node"],
      ["deleteNode", "deleted", "node"],
      ["updateEdge", "relabeled", "edge"],
      ["deleteEdge", "deleted", "edge"],
    ] as const
  ).flatMap(([toolName, verb, noun]) => {
    const count = appliedByTool[toolName] ?? 0;
    return count > 0 ? [`${verb} ${count} ${noun}${count === 1 ? "" : "s"}`] : [];
  });

  const changes =
    applied === 0 ? "No changes made." : `${capitalize(parts.join(", "))}.`;
  const skippedNote =
    skipped.length === 0
      ? ""
      : ` Skipped ${skipped.length} invalid action${skipped.length === 1 ? "" : "s"}.`;
  return changes + skippedNote;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
