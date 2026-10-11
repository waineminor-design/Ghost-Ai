import "server-only";

import { LiveObject } from "@liveblocks/node";

import type { AiStatus } from "@/lib/ai-status";
import { getLiveblocks } from "@/lib/liveblocks";

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
