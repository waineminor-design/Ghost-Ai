import { CanvasRoom } from "@/components/canvas/canvas-room";

// Workspace layout for /editor/[projectId]: the shared canvas fills the
// space left of a fixed-width AI chat sidebar (still a placeholder).
export function ProjectWorkspace({ projectId }: { projectId: string }) {
  return (
    <div className="flex h-full">
      <section aria-label="Canvas" className="min-w-0 flex-1 bg-background">
        {/* Keyed so switching projects starts a fresh room state. */}
        <CanvasRoom key={projectId} projectId={projectId} />
      </section>
      {/* Hidden on small screens so the canvas keeps its width. */}
      <aside
        aria-label="AI chat"
        className="hidden w-80 shrink-0 flex-col items-center justify-center border-l border-border bg-sidebar md:flex"
      >
        <p className="text-sm text-muted-foreground">AI chat coming soon</p>
      </aside>
    </div>
  );
}
