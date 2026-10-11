// Workspace layout for /editor/[projectId]: the canvas fills the space
// left of a fixed-width AI chat sidebar. Both are placeholders for now.
export function ProjectWorkspace() {
  return (
    <div className="flex h-full">
      <section
        aria-label="Canvas"
        className="flex min-w-0 flex-1 items-center justify-center bg-background"
      >
        <p className="text-sm text-muted-foreground">Canvas coming soon</p>
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
