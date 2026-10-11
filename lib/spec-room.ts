import "server-only";

import { getLiveblocks } from "@/lib/liveblocks";

// Writes the time (ISO) to the room's `specsUpdatedAt` storage key after
// the spec generator saved a spec, so everyone with the project open knows
// to refresh their spec list. Creates the key on the first write.
export async function writeSpecsUpdatedAt(
  roomId: string,
  updatedAt: string,
): Promise<void> {
  await getLiveblocks().mutateStorage(roomId, ({ root }) => {
    root.set("specsUpdatedAt", updatedAt);
  });
}
