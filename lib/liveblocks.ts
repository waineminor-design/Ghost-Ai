import "server-only";

import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: Liveblocks;
};

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  return new Liveblocks({ secret });
}

// One client per process; cached on globalThis in development so hot
// reloads reuse it.
export const liveblocks = globalForLiveblocks.liveblocks ?? createLiveblocksClient();

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}

// Cursor colors, readable on the dark canvas. The only place they are
// defined; users get one through getUserColor().
const USER_COLORS = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#2dd4bf", // teal
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
] as const;

// The same user id always maps to the same color (FNV-1a hash of the id).
export function getUserColor(userId: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return USER_COLORS[(hash >>> 0) % USER_COLORS.length];
}
