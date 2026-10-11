import { CanvasRoom } from "@/components/canvas/canvas-room";
import { AiSidebar } from "@/components/editor/ai-sidebar";

// Workspace layout for /editor/[projectId]: the shared canvas fills the
// whole area under the navbar, and the AI sidebar floats over its right
// edge.
export function ProjectWorkspace({ projectId }: { projectId: string }) {
  return (
    <div className="relative h-full">
      <section aria-label="Canvas" className="size-full bg-background">
        {/* Keyed so switching projects starts a fresh room state. */}
        <CanvasRoom key={projectId} projectId={projectId} />
      </section>
      <AiSidebar />
    </div>
  );
}
