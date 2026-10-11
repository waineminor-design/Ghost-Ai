"use client";

import { useState, type ReactNode } from "react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
  useStatus,
} from "@liveblocks/react/suspense";
import { ReactFlowProvider } from "@xyflow/react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { Canvas } from "@/components/canvas/canvas";
import { PresenceAvatars } from "@/components/editor/presence-avatars";

// Client entry point for a project's canvas. Joins the Liveblocks room
// whose id is the project id; /api/liveblocks-auth only issues a token for
// it to the owner and collaborators. `children` is UI next to the canvas
// that also reads the room (the AI sidebar); it renders while the room
// connects and if the connection fails, so it must not suspend. The React
// Flow provider wraps both, so the sidebar can move this user's view of
// the canvas (fit it after a design run).
export function CanvasRoom({
  projectId,
  children,
}: {
  projectId: string;
  children?: ReactNode;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={projectId}
        initialPresence={{ cursor: null, isThinking: false }}
        initialStorage={createInitialStorage}
      >
        <ReactFlowProvider>
          <section aria-label="Canvas" className="size-full bg-background">
            <RoomContent projectId={projectId} />
          </section>
          {children}
        </ReactFlowProvider>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// Storage for a room that has none yet: an empty canvas. Existing rooms
// keep their storage; this only runs the first time a room is joined.
// `aiStatus` and `aiChat` are left out: the design agent creates
// `aiStatus` on its first run, and the first chat message creates `aiChat`.
function createInitialStorage(): Liveblocks["Storage"] {
  return {
    flow: new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() }),
  };
}

// Shows "Connecting to room…" until storage has loaded, then the canvas,
// and the avatar stack in the navbar once the room is connected.
// A rejected token or a refused connection never loads storage, so the
// error listener swaps the pending state for an error message. If the
// room reconnects afterwards, the error is cleared and the canvas returns.
function RoomContent({ projectId }: { projectId: string }) {
  const [connectionError, setConnectionError] = useState<number | null>(null);
  const status = useStatus();

  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      setConnectionError(error.context.code);
    }
  });

  // Clear the error when the room (re)connects. Done during render on a
  // status change, as React recommends for state derived from props.
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "connected") setConnectionError(null);
  }

  if (connectionError !== null) {
    return <RoomError code={connectionError} />;
  }

  return (
    <>
      <ClientSideSuspense fallback={<RoomConnecting />}>
        <Canvas projectId={projectId} />
      </ClientSideSuspense>
      <ClientSideSuspense fallback={null}>
        <PresenceAvatars />
      </ClientSideSuspense>
    </>
  );
}

function RoomConnecting() {
  return (
    <RoomStatus>
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <p className="text-sm">Connecting to room…</p>
    </RoomStatus>
  );
}

// Liveblocks codes: -1 = authentication failed, 4001 = no access to the
// room. Anything else is a connection problem on our or Liveblocks' side.
function RoomError({ code }: { code: number }) {
  const isAccessError = code === -1 || code === 4001;

  return (
    <RoomStatus>
      <TriangleAlert className="size-5 text-destructive" aria-hidden />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t connect to the canvas
        </p>
        <p className="text-sm">
          {isAccessError
            ? "Your access could not be verified. Refresh the page to try again."
            : "The connection to the room failed. Refresh the page to try again."}
        </p>
      </div>
    </RoomStatus>
  );
}

function RoomStatus({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground"
    >
      {children}
    </div>
  );
}
