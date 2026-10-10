import { Suspense, use } from "react";
import {
  Folder,
  FolderOpen,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EditorProjects, Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectsPromise: Promise<EditorProjects>;
  onNewProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

// Positioned absolutely so it floats over the editor canvas without
// pushing content. The parent canvas container must be `relative`.
export function ProjectSidebar({
  isOpen,
  onClose,
  projectsPromise,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const listProps = { projectsPromise, onRenameProject, onDeleteProject };

  return (
    <>
      {/* Mobile only: tapping the scrim outside the sidebar closes it. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-30 bg-background/60 backdrop-blur-xs transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Projects"
        inert={!isOpen}
        className={cn(
          "absolute inset-y-2 left-2 z-40 flex w-72 flex-col rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.5rem)]",
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
          <h2 className="text-sm font-medium">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 p-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects" className="min-h-0 overflow-y-auto">
            <Suspense fallback={<ProjectListLoading />}>
              <ProjectList
                {...listProps}
                group="owned"
                emptyIcon={FolderOpen}
                emptyMessage="No projects yet"
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="shared" className="min-h-0 overflow-y-auto">
            <Suspense fallback={<ProjectListLoading />}>
              <ProjectList
                {...listProps}
                group="shared"
                emptyIcon={Users}
                emptyMessage="No shared projects"
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <Button className="w-full" onClick={onNewProject}>
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projectsPromise: Promise<EditorProjects>;
  group: "owned" | "shared";
  emptyIcon: LucideIcon;
  emptyMessage: string;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

function ProjectList({
  projectsPromise,
  group,
  emptyIcon,
  emptyMessage,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  const { currentUserId, [group]: projects } = use(projectsPromise);

  if (projects.length === 0) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} />;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <li
          key={project.id}
          className="group flex h-9 items-center gap-2 rounded-md px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{project.name}</span>
          {/* Only the owner can rename or delete a project. */}
          {project.ownerId === currentUserId && (
            <div className="flex shrink-0 items-center gap-0.5 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onRenameProject(project)}
                aria-label={`Rename ${project.name}`}
                title="Rename"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDeleteProject(project)}
                aria-label={`Delete ${project.name}`}
                title="Delete"
                className="hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ProjectListLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
      <p className="text-sm">Loading projects…</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Icon className="size-5" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
