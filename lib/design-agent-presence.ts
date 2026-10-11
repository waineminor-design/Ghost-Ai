import "server-only";

import { AI_USER, getLiveblocks } from "@/lib/liveblocks";

// The design agent's presence in a project's room: it shows up in the
// avatar stack as Ghost AI with `isThinking: true`, and with a cursor near
// where it is working. Set through the REST API (no WebSocket), so it
// expires after its TTL unless refreshed.

type Cursor = Liveblocks["Presence"]["cursor"];

const TTL_SECONDS = 60;
// Refreshed well inside the TTL, so it never lapses during a long model
// call; if the task dies, it disappears within a minute.
const REFRESH_MS = 20_000;
// The API's minimum TTL: "clearing" lets the presence expire right away.
const CLEAR_TTL_SECONDS = 2;

export function createAiPresence(roomId: string) {
  let cursor: Cursor = null;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;

  // Async, so any failure (even a missing key) is a rejected promise.
  const send = async (presence: Liveblocks["Presence"], ttl: number) =>
    getLiveblocks().setPresence(roomId, {
      userId: AI_USER.id,
      data: presence,
      userInfo: AI_USER.info,
      ttl,
    });

  return {
    // Shows the agent as thinking, with its cursor at `nextCursor` (flow
    // coordinates, like users' cursors).
    async show(nextCursor: Cursor) {
      cursor = nextCursor;
      refreshTimer ??= setInterval(() => {
        // A failed refresh is retried on the next tick; the run itself
        // must not fail over presence.
        send({ cursor, isThinking: true }, TTL_SECONDS).catch(() => {});
      }, REFRESH_MS);
      await send({ cursor, isThinking: true }, TTL_SECONDS);
    },

    // Stops refreshing and lets the presence expire within seconds.
    async clear() {
      clearInterval(refreshTimer);
      refreshTimer = undefined;
      await send({ cursor: null, isThinking: false }, CLEAR_TTL_SECONDS);
    },
  };
}
