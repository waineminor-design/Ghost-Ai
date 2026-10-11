"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectDialogsContext } from "@/components/editor/project-dialogs-context";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import type { EditorProjects } from "@/lib/projects";

// Client entry point for the editor chrome. Owns the sidebar and project
// dialog state and renders the canvas (children) underneath the floating
// sidebar. `projectsPromise` comes from the server layout; the navbar and
// sidebar resolve it behind their own Suspense boundaries.
export function EditorShell({
  projectsPromise,
  children,
}: {
  projectsPromise: Promise<EditorProjects>;
  children?: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  return (
    <ProjectDialogsContext value={{ openCreateDialog: dialogs.openCreateDialog }}>
      <div className="flex h-screen flex-col">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectsPromise={projectsPromise}
        />
        <main className="relative flex-1 overflow-hidden">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            projectsPromise={projectsPromise}
            onNewProject={dialogs.openCreateDialog}
            onRenameProject={dialogs.openRenameDialog}
            onDeleteProject={dialogs.openDeleteDialog}
          />
          {children}
        </main>
      </div>
      <ProjectDialogs dialogs={dialogs} />
    </ProjectDialogsContext>
  );
}
