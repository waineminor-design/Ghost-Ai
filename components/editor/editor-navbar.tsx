import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentProject } from "@/hooks/use-current-project";
import type { EditorProjects } from "@/lib/projects";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectsPromise: Promise<EditorProjects>;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectsPromise,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="grid h-12 shrink-0 grid-cols-3 items-center border-b border-border bg-background px-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
        >
          <ToggleIcon className="size-5" />
        </Button>
      </div>
      <div className="flex min-w-0 items-center justify-center">
        <Suspense>
          <ProjectName projectsPromise={projectsPromise} />
        </Suspense>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Suspense>
          <WorkspaceActions projectsPromise={projectsPromise} />
        </Suspense>
        <UserButton />
      </div>
    </header>
  );
}

// Name of the open workspace's project; nothing outside a workspace.
function ProjectName({
  projectsPromise,
}: {
  projectsPromise: Promise<EditorProjects>;
}) {
  const project = useCurrentProject(projectsPromise);
  if (!project) return null;

  return <h1 className="truncate text-sm font-medium">{project.name}</h1>;
}

// Actions for the open workspace. `Share` is a placeholder until the
// share dialog exists.
function WorkspaceActions({
  projectsPromise,
}: {
  projectsPromise: Promise<EditorProjects>;
}) {
  const project = useCurrentProject(projectsPromise);
  if (!project) return null;

  return (
    <Button variant="outline" size="sm">
      <Share2 data-icon="inline-start" />
      Share
    </Button>
  );
}
