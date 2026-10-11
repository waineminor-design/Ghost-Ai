import type { CSSProperties } from "react";
import { Cursors, type CursorsCursorProps } from "@liveblocks/react-flow";
import { shallow, useOther } from "@liveblocks/react/suspense";
import { LoaderCircle } from "lucide-react";

import { AI_USER } from "@/lib/ai-user";

// Defined once, outside the component, like React Flow's node types.
const CURSOR_COMPONENTS = { Cursor: CollaboratorCursor };

// Live cursors of everyone else in the room. Liveblocks' <Cursors> stores
// this user's pointer in the `cursor` presence in canvas (flow)
// coordinates — converted with screenToFlowPosition, throttled by the
// Liveblocks client, null when the pointer leaves the canvas — and draws
// each other user's cursor at that canvas point under the local pan and
// zoom, so it points at the same diagram spot for everyone. Your own
// cursor is never drawn; a user's cursor goes when they leave.
// The overlay sits above the nodes (z-4) and lets every click through.
// Must render inside <ReactFlow> and a RoomProvider.
export function CollaboratorCursors() {
  return (
    <Cursors
      className="pointer-events-none absolute inset-0 z-5 overflow-hidden"
      components={CURSOR_COMPONENTS}
    />
  );
}

// A pointer arrow in the user's cursor color with their name on a pill in
// the same color. The arrow's tip is the cursor position: <Cursors> moves
// a wrapper to that point, and this sits at the wrapper's top-left. While
// Ghost AI is thinking, its pill shows a small spinner before the name.
function CollaboratorCursor({ connectionId }: CursorsCursorProps) {
  const { name, color, isThinking } = useOther(
    connectionId,
    (other) => ({
      name: other.info.name,
      color: other.info.color,
      isThinking: other.id === AI_USER.id && other.presence.isThinking,
    }),
    shallow,
  );

  return (
    <div
      // The cursor color is user data (a hex value from the auth
      // endpoint), so it comes in as a CSS variable.
      style={{ "--user-color": color } as CSSProperties}
      className="absolute top-0 left-0"
    >
      <svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        className="overflow-visible fill-(--user-color) stroke-foreground"
        aria-hidden
      >
        <path
          d="M0 0 L0 13 L3.6 9.8 L6.1 15.2 L8.5 14.1 L6 8.8 L10.6 8.8 Z"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute top-4 left-2.5 flex items-center gap-1 rounded-full bg-(--user-color) px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background shadow-sm">
        {isThinking && <LoaderCircle className="size-3 animate-spin" aria-hidden />}
        {name}
      </span>
    </div>
  );
}
