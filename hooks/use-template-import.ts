import { useMutation } from "@liveblocks/react/suspense";
import type { OnEdgesChange, OnNodesChange } from "@xyflow/react";

import { useCanvasActions } from "@/hooks/use-canvas-actions";
import { instantiateTemplate, type CanvasTemplate } from "@/lib/canvas-templates";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

type FlowChangeHandlers = {
  // From useLiveblocksFlow: they write nodes and edges into room storage.
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
};

// Replaces the whole canvas with a copy of a template (fresh ids), then
// fits the view to it. The clear and the adds run in one Liveblocks
// mutation, so collaborators see the new diagram in one update and one
// undo restores the previous canvas. The new nodes and edges are written
// by the flow's own change handlers, the same path as shapes added from
// the panel. Must be used inside a RoomProvider and a ReactFlowProvider.
export function useTemplateImport({ onNodesChange, onEdgesChange }: FlowChangeHandlers) {
  const { fitView } = useCanvasActions();

  // Nested mutations join the outer batch, so everything here is a single
  // history entry. Everything currently in storage is removed, including
  // anything a collaborator added after the import was confirmed.
  const replaceCanvas = useMutation(
    ({ storage }, nodes: CanvasNode[], edges: CanvasEdge[]) => {
      const flow = storage.get("flow");
      const storedEdges = flow.get("edges");
      const storedNodes = flow.get("nodes");
      for (const id of Array.from(storedEdges.keys())) storedEdges.delete(id);
      for (const id of Array.from(storedNodes.keys())) storedNodes.delete(id);

      onNodesChange(nodes.map((item) => ({ type: "add", item })));
      onEdgesChange(edges.map((item) => ({ type: "add", item })));
    },
    [onNodesChange, onEdgesChange],
  );

  return function importTemplate(template: CanvasTemplate) {
    const { nodes, edges } = instantiateTemplate(template);
    replaceCanvas(nodes, edges);
    // React Flow queues this until the new nodes are rendered and
    // measured, so it fits the template, not the old canvas. Only this
    // user's view moves; everyone keeps their own viewport.
    fitView();
  };
}
