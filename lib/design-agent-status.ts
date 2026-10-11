import "server-only";

import { LiveObject } from "@liveblocks/node";

import { getAiStatusView, parseAiStatus, type AiStatus } from "@/lib/ai-status";
import { getLiveblocks } from "@/lib/liveblocks";

// True while the room's AI status shows an active design run (started,
// thinking or applying, and not yet stale). A room that can't be read, or
// has no status, counts as not running.
export async function isAiRunActive(roomId: string): Promise<boolean> {
  try {
    const storage = await getLiveblocks().getStorageDocument(roomId, "json");
    const status = parseAiStatus((storage as Record<string, unknown>).aiStatus);
    return getAiStatusView(status, Date.now()).kind === "active";
  } catch {
    return false;
  }
}

// Writes the design agent's status to the room's `aiStatus` storage key,
// which everyone in the room sees in the AI sidebar. Creates the key on
// the first write (rooms that never had a run don't have it) and replaces
// a value that isn't a LiveObject (clients can write storage too).
export async function writeAiStatus(roomId: string, status: AiStatus): Promise<void> {
  await getLiveblocks().mutateStorage(roomId, ({ root }) => {
    const current = root.get("aiStatus");
    if (current instanceof LiveObject) {
      current.update(status);
    } else {
      root.set("aiStatus", new LiveObject(status));
    }
  });
}
