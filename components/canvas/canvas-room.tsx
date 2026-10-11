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
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { Canvas } from "@/components/canvas/canvas";

// Client entry point for a project's canvas. Joins the Liveblocks room
// whose id is the project id; /api/liveblocks-auth only issues a token for
// it to the owner and collaborators.
export function CanvasRoom({ projectId }: { projectId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={projectId}
        initialPresence={{ cursor: null, isThinking: false }}
        initialStorage={createInitialStorage}
      >
        <RoomContent />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// Storage for a room that has none yet: an empty canvas. Existing rooms
// keep their storage; this only runs the first time a room is joined.
function createInitialStorage(): Liveblocks["Storage"] {
  return {
    flow: new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() }),
  };
}

// Shows "Connecting to room…" until storage has loaded, then the canvas.
// A rejected token or a refused connection never loads storage, so the
// error listener swaps the pending state for an error message. If the
// room reconnects afterwards, the error is cleared and the canvas returns.
function RoomContent() {
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
    <ClientSideSuspense fallback={<RoomConnecting />}>
      <Canvas />
    </ClientSideSuspense>
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
