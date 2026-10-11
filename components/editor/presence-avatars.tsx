import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { shallow, useOthersMapped, useSelf } from "@liveblocks/react/suspense";

import { usePresenceSlot } from "@/components/editor/presence-slot-context";
import { Avatar, AvatarFallback, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Avatars shown before the `+N` circle: 4 from `lg`, 2 between `md` and
// `lg`, where the navbar's right section has less room. Below `md` the
// stack is hidden; the right section is already full on phones.
const MAX_AVATARS = 4;
const MAX_AVATARS_NARROW = 2;

type RoomUser = {
  id: string;
  info: Liveblocks["UserMeta"]["info"];
};

// Everyone in the room, you included, as overlapping avatars in the
// navbar. Renders into the navbar slot from PresenceSlotContext; nothing
// until that slot exists. Must render inside a RoomProvider, a Suspense
// boundary and EditorShell.
export function PresenceAvatars() {
  const slot = usePresenceSlot();
  if (!slot) return null;

  return createPortal(<AvatarStack />, slot);
}

function AvatarStack() {
  // Selectors keep only id and info, so presence changes (cursor moves)
  // don't re-render the stack; it updates when people join or leave.
  const self = useSelf((me): RoomUser => ({ id: me.id, info: me.info }), shallow);
  const others = useOthersMapped(
    (other): RoomUser => ({ id: other.id, info: other.info }),
    shallow,
  );

  // One avatar per person: the same user in two tabs is two connections.
  const users = [self];
  const seen = new Set([self.id]);
  for (const [, user] of others) {
    if (seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }

  const hiddenCount = users.length - MAX_AVATARS;
  const hiddenCountNarrow = users.length - MAX_AVATARS_NARROW;

  return (
    <TooltipProvider>
      <div
        role="group"
        aria-label="People in this project"
        className="flex items-center max-md:hidden"
      >
        {users.slice(0, MAX_AVATARS).map((user, index) => (
          <UserAvatar
            key={user.id}
            user={user}
            isSelf={index === 0}
            className={index >= MAX_AVATARS_NARROW ? "max-lg:hidden" : undefined}
          />
        ))}
        {hiddenCountNarrow > 0 && (
          <OverflowCount count={hiddenCountNarrow} className="lg:hidden" />
        )}
        {hiddenCount > 0 && (
          <OverflowCount count={hiddenCount} className="max-lg:hidden" />
        )}
      </div>
    </TooltipProvider>
  );
}

// Clerk image, or initials on a circle in the user's cursor color, ringed
// in that color. The name (plus "(you)") shows in a tooltip on hover.
function UserAvatar({
  user,
  isSelf,
  className,
}: {
  user: RoomUser;
  isSelf: boolean;
  className?: string;
}) {
  const { name, avatar, color } = user.info;
  const label = isSelf ? `${name} (you)` : name;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Avatar />}
        role="img"
        aria-label={label}
        // The cursor color is user data (a hex value from the auth
        // endpoint), so it comes in as a CSS variable.
        style={{ "--user-color": color } as CSSProperties}
        className={cn(
          "ring-2 ring-(--user-color) ring-offset-2 ring-offset-background not-first:-ml-2",
          className,
        )}
      >
        {avatar && <AvatarImage src={avatar} alt="" />}
        <AvatarFallback className="bg-(--user-color) text-xs font-medium text-background">
          {getInitials(name)}
        </AvatarFallback>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function OverflowCount({ count, className }: { count: number; className: string }) {
  return (
    <AvatarGroupCount
      role="img"
      aria-label={`${count} more ${count === 1 ? "person" : "people"}`}
      className={cn("text-xs font-medium not-first:-ml-2", className)}
    >
      +{count}
    </AvatarGroupCount>
  );
}

// First letters of the first and last word ("Ada Lovelace" → "AL").
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
  return (first + last).toUpperCase();
}
