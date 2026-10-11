import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

// Shown for projects the user can't open, including ids that don't exist.
export function AccessDenied() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="font-heading text-xl font-medium">
          You don&apos;t have access to this workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask the project owner to invite you, or open one of your own projects.
        </p>
      </div>
      <Link href="/editor" className={buttonVariants({ variant: "outline" })}>
        Back to projects
      </Link>
    </div>
  );
}
