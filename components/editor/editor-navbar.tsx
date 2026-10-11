import { Suspense, use } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react";

import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { useCurrentProject } from "@/hooks/use-current-project";
import { useProjectShare } from "@/hooks/use-project-share";
import type { EditorProjects } from "@/lib/projects";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenTemplates: () => void;
  // Receive the elements the canvas room portals the avatar stack and the
  // Save button into.
  presenceSlotRef: (element: HTMLElement | null) => void;
  saveSlotRef: (element: HTMLElement | null) => void;
  projectsPromise: Promise<EditorProjects>;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenTemplates,
  presenceSlotRef,
  saveSlotRef,
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
        <Suspense>
          <TemplatesAction
            projectsPromise={projectsPromise}
            onOpenTemplates={onOpenTemplates}
          />
        </Suspense>
        {/* The canvas renders the Save button here, so it only shows in a
            workspace. In the left section because the right one is full
            on phones; `contents` leaves no gap while it is empty. */}
        <div ref={saveSlotRef} className="contents" />
      </div>
      <div className="flex min-w-0 items-center justify-center">
        <Suspense>
          <ProjectName projectsPromise={projectsPromise} />
        </Suspense>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Suspense>
          <WorkspaceActions
            projectsPromise={projectsPromise}
            isAiSidebarOpen={isAiSidebarOpen}
            onToggleAiSidebar={onToggleAiSidebar}
            presenceSlotRef={presenceSlotRef}
          />
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

// Opens the starter templates dialog for the open workspace; nothing
// outside a workspace. In the left section because the right one is full
// on phones. Icon-only below `sm`.
function TemplatesAction({
  projectsPromise,
  onOpenTemplates,
}: {
  projectsPromise: Promise<EditorProjects>;
  onOpenTemplates: () => void;
}) {
  const project = useCurrentProject(projectsPromise);
  if (!project) return null;

  return (
    <Button variant="ghost" size="sm" onClick={onOpenTemplates} className="max-sm:pr-1.5">
      <LayoutTemplate data-icon="inline-start" />
      <span className="max-sm:sr-only">Templates</span>
    </Button>
  );
}

// Actions for the open workspace; nothing outside a workspace. The
// presence slot is where the canvas room renders the avatar stack.
function WorkspaceActions({
  projectsPromise,
  isAiSidebarOpen,
  onToggleAiSidebar,
  presenceSlotRef,
}: {
  projectsPromise: Promise<EditorProjects>;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  presenceSlotRef: (element: HTMLElement | null) => void;
}) {
  const { currentUserId } = use(projectsPromise);
  const project = useCurrentProject(projectsPromise);
  if (!project) return null;

  const AiToggleIcon = isAiSidebarOpen ? PanelRightClose : PanelRightOpen;

  return (
    <>
      {/* `contents`: the stack takes part in this flex row directly, and
          leaves no gap while it is hidden or not rendered. */}
      <div ref={presenceSlotRef} className="contents" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleAiSidebar}
        aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
        aria-expanded={isAiSidebarOpen}
      >
        <AiToggleIcon className="size-5" />
      </Button>
      {/* Keyed so switching projects starts with fresh share state. */}
      <ShareAction
        key={project.id}
        projectId={project.id}
        isOwner={project.ownerId === currentUserId}
      />
    </>
  );
}

function ShareAction({
  projectId,
  isOwner,
}: {
  projectId: string;
  isOwner: boolean;
}) {
  const share = useProjectShare(projectId);

  return (
    <>
      {/* Icon-only below `sm` so the right section fits on phones. */}
      <Button
        variant="outline"
        size="sm"
        onClick={share.openDialog}
        className="max-sm:pr-1.5"
      >
        <Share2 data-icon="inline-start" />
        <span className="max-sm:sr-only">Share</span>
      </Button>
      <ShareDialog share={share} isOwner={isOwner} />
    </>
  );
}
