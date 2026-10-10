"use client";

import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectDialogsContext } from "@/components/editor/project-dialogs-context";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_CURRENT_USER_ID, MOCK_PROJECTS } from "@/lib/mock-projects";

// Client entry point for the editor chrome. Owns the sidebar and project
// dialog state and renders the canvas (children) underneath the floating
// sidebar.
export function EditorShell({ children }: { children?: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  return (
    <ProjectDialogsContext value={{ openCreateDialog: dialogs.openCreateDialog }}>
      <div className="flex h-screen flex-col">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        />
        <main className="relative flex-1 overflow-hidden">
          <ProjectSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            projects={MOCK_PROJECTS}
            currentUserId={MOCK_CURRENT_USER_ID}
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
