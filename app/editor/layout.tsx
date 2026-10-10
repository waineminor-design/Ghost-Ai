import { Suspense, type ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

import { EditorShell } from "@/components/editor/editor-shell";
import { listProjectsForUser, type ProjectRecord } from "@/lib/project-data";
import type { EditorProjects, Project } from "@/lib/projects";

export default function EditorLayout({ children }: LayoutProps<"/editor">) {
  return (
    <Suspense>
      <EditorChrome>{children}</EditorChrome>
    </Suspense>
  );
}

// Creates the projects promise inside the Suspense boundary without
// awaiting it, so the chrome and page stay in the static shell and only
// the sidebar's project lists wait for the session.
function EditorChrome({ children }: { children: ReactNode }) {
  return (
    <EditorShell projectsPromise={loadEditorProjects()}>{children}</EditorShell>
  );
}

async function loadEditorProjects(): Promise<EditorProjects> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  // Shared projects match collaborator rows by the primary email.
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const { owned, shared } = await listProjectsForUser(userId, email);

  return {
    currentUserId: userId,
    owned: owned.map(toProject),
    shared: shared.map(toProject),
  };
}

// Only the fields the sidebar needs cross to the client.
function toProject({ id, name, ownerId }: ProjectRecord): Project {
  return { id, name, ownerId };
}
