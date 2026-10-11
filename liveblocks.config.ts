import type { LiveObject } from "@liveblocks/client";
import type { LiveblocksFlow } from "@liveblocks/react-flow";

import type { AiStatus } from "@/lib/ai-status";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas-types";

// Global Liveblocks types. Every Liveblocks hook, component and the Node
// client (`lib/liveblocks.ts`) are typed from this declaration.
declare global {
  interface Liveblocks {
    // Each user's realtime state, for useMyPresence, useOthers, etc.
    Presence: {
      // Pointer position on the canvas; null when off the canvas.
      cursor: { x: number; y: number } | null;
      // True while the AI agent is working for this user.
      isThinking: boolean;
    };

    // The room's shared storage: the canvas nodes and edges, in the shape
    // useLiveblocksFlow syncs (its default "flow" storage key), and the AI
    // status everyone sees in the AI sidebar. Rooms that never had a design
    // run have no `aiStatus` (read as idle); the design agent creates it on
    // its first write.
    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
      aiStatus?: LiveObject<AiStatus>;
    };

    // Set by POST /api/liveblocks-auth when the session is prepared.
    UserMeta: {
      // Clerk user id.
      id: string;
      info: {
        name: string;
        // Avatar URL; absent when the user has none. Liveblocks reserves
        // `avatar` as `string | undefined`, so it can't be null.
        avatar?: string;
        // Cursor color from getUserColor().
        color: string;
      };
    };
  }
}
