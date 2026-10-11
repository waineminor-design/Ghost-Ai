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

    // The room's shared storage. Placeholder until the canvas
    // (feature 11) adds nodes and edges.
    Storage: Record<string, never>;

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

// Necessary because this file has no other imports or exports.
export {};
