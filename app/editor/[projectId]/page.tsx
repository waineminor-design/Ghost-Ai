import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { LoaderCircle } from "lucide-react";

import { AccessDenied } from "@/components/editor/access-denied";
import { ProjectWorkspace } from "@/components/editor/project-workspace";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

// Project workspace. The navbar and project sidebar come from
// app/editor/layout.tsx. Params and the session are request data, so the
// access check streams in behind this page's own Suspense boundary and
// the editor chrome stays in the static shell.
export default function ProjectWorkspacePage({
  params,
}: PageProps<"/editor/[projectId]">) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <GuardedWorkspace params={params} />
    </Suspense>
  );
}

async function GuardedWorkspace({
  params,
}: {
  params: PageProps<"/editor/[projectId]">["params"];
}) {
  const { projectId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) return (await auth()).redirectToSignIn();

  const access = await getProjectAccess(projectId, identity);
  if (!access) return <AccessDenied />;

  return <ProjectWorkspace />;
}

function WorkspaceLoading() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <LoaderCircle
        className="size-5 animate-spin"
        aria-label="Loading workspace"
      />
    </div>
  );
}
