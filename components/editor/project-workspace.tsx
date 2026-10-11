import { CanvasRoom } from "@/components/canvas/canvas-room";
import { AiSidebar } from "@/components/editor/ai-sidebar";

// Workspace layout for /editor/[projectId]: the shared canvas fills the
// whole area under the navbar, and the AI sidebar floats over its right
// edge. The sidebar renders inside the room, so it can show the room's AI
// status.
export function ProjectWorkspace({ projectId }: { projectId: string }) {
  return (
    <div className="relative h-full">
      {/* Keyed so switching projects starts a fresh room state (and a
          fresh AI chat). */}
      <CanvasRoom key={projectId} projectId={projectId}>
        <AiSidebar />
      </CanvasRoom>
    </div>
  );
}
