import { Suspense, type ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";

import { EditorShell } from "@/components/editor/editor-shell";
import { getCurrentIdentity } from "@/lib/project-access";
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
  const identity = await getCurrentIdentity();
  if (!identity) return (await auth()).redirectToSignIn();

  // Shared projects match collaborator rows by the primary email.
  const { owned, shared } = await listProjectsForUser(
    identity.userId,
    identity.email,
  );

  return {
    currentUserId: identity.userId,
    owned: owned.map(toProject),
    shared: shared.map(toProject),
  };
}

// Only the fields the sidebar needs cross to the client.
function toProject({ id, name, ownerId }: ProjectRecord): Project {
  return { id, name, ownerId };
}
