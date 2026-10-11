import { useId, type ReactNode } from "react";
import { Check, LinkIcon, LoaderCircle, UserRound, X } from "lucide-react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { RequestError } from "@/components/editor/project-dialogs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectShare } from "@/hooks/use-project-share";
import type { MemberProfile } from "@/lib/collaborators";

const COPY_FAILED_MESSAGE =
  "Couldn't copy the link. Copy it from the address bar instead.";

interface ShareDialogProps {
  share: ProjectShare;
  // Shows the invite form and remove buttons. Display only: the API
  // rejects invites and removals from anyone but the owner.
  isOwner: boolean;
}

// Share dialog for the open workspace, driven by useProjectShare.
export function ShareDialog({ share, isOwner }: ShareDialogProps) {
  const {
    isOpen,
    members,
    isLoading,
    email,
    isEmailValid,
    isInviting,
    removingId,
    isPending,
    error,
    copyLinkStatus,
    setEmail,
    closeDialog,
    invite,
    removeCollaborator,
    copyLink,
  } = share;
  const inputId = useId();
  const listHeadingId = useId();

  return (
    <EditorDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
      title="Share project"
      description={
        isOwner
          ? "Invite people by email. Collaborators can open and edit this workspace."
          : "People with access to this workspace. Only the owner can invite or remove people."
      }
      footer={<CopyLinkButton status={copyLinkStatus} onCopy={copyLink} />}
    >
      {isOwner && (
        <form
          className="grid gap-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void invite();
          }}
        >
          <label htmlFor={inputId} className="text-sm font-medium">
            Email address
          </label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
              readOnly={isInviting}
            />
            <Button type="submit" disabled={!isEmailValid || isPending}>
              {isInviting && (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              )}
              Invite
            </Button>
          </div>
        </form>
      )}

      <section aria-labelledby={listHeadingId} className="grid gap-1">
        <h3 id={listHeadingId} className="text-sm font-medium">
          People with access
        </h3>
        {members ? (
          <ul className="-mx-1 max-h-64 overflow-y-auto">
            <MemberRow
              profile={members.owner}
              fallbackName="Project owner"
              badge="Owner"
            />
            {members.collaborators.map((collaborator) => (
              <MemberRow
                key={collaborator.id}
                profile={collaborator}
                action={
                  isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void removeCollaborator(collaborator.id)}
                      disabled={isPending}
                      aria-label={`Remove ${collaborator.email}`}
                    >
                      {removingId === collaborator.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <X />
                      )}
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        ) : (
          isLoading && (
            <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading people…
            </p>
          )
        )}
        {members?.collaborators.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No collaborators yet.
          </p>
        )}
      </section>

      {copyLinkStatus === "failed" && (
        <RequestError message={COPY_FAILED_MESSAGE} />
      )}
      <RequestError message={error} />
    </EditorDialog>
  );
}

interface MemberRowProps {
  profile: MemberProfile;
  // Shown when the profile has neither a name nor an email.
  fallbackName?: string;
  badge?: string;
  action?: ReactNode;
}

// Avatar, name and email. Without a Clerk user only the email shows,
// next to a generic avatar.
function MemberRow({ profile, fallbackName, badge, action }: MemberRowProps) {
  const { name, email, imageUrl } = profile;

  return (
    <li className="flex items-center gap-3 rounded-md px-1 py-1.5">
      <Avatar>
        {imageUrl && <AvatarImage src={imageUrl} alt="" />}
        <AvatarFallback>
          <UserRound className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {name ?? email ?? fallbackName}
        </p>
        {name && email && (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        )}
      </div>
      {badge && (
        <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
          {badge}
        </span>
      )}
      {action}
    </li>
  );
}

function CopyLinkButton({
  status,
  onCopy,
}: {
  status: ProjectShare["copyLinkStatus"];
  onCopy: () => Promise<void>;
}) {
  const copied = status === "copied";

  return (
    <Button variant="outline" onClick={() => void onCopy()}>
      {copied ? (
        <Check data-icon="inline-start" />
      ) : (
        <LinkIcon data-icon="inline-start" />
      )}
      {/* Announced to screen readers when it changes to "Copied!". */}
      <span aria-live="polite">{copied ? "Copied!" : "Copy link"}</span>
    </Button>
  );
}
