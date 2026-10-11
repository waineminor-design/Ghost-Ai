import { useEffect, useState } from "react";
// The regular (non-suspense) hook: the AI sidebar must not suspend.
import { useStorage } from "@liveblocks/react";

import { sendJsonRequest } from "@/lib/api-client";
import { parseSpecList, type SpecSummary } from "@/lib/specs";

export interface SpecList {
  // Newest first; null until the first load answers (or when it failed).
  specs: SpecSummary[] | null;
  // True when the last load failed.
  hasFailed: boolean;
}

// The project's specs, loaded when the Specs tab mounts it, and again
// whenever the room's `specsUpdatedAt` changes (the spec generator sets it
// after saving, so a collaborator's new spec appears for everyone) or
// `refreshKey` changes. A reload keeps showing the previous list until it
// answers. Must be used inside a RoomProvider.
export function useSpecList(projectId: string, refreshKey: number): SpecList {
  const [specs, setSpecs] = useState<SpecSummary[] | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  // null while storage loads, and in rooms that never saved a spec.
  const specsUpdatedAt = useStorage((root) => root.specsUpdatedAt ?? null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await sendJsonRequest(
          `/api/projects/${encodeURIComponent(projectId)}/specs`,
          { signal: controller.signal },
        );
        const list = parseSpecList(data);
        if (!list) throw new Error("Unexpected spec list response");
        if (controller.signal.aborted) return;
        setSpecs(list);
        setHasFailed(false);
      } catch {
        if (!controller.signal.aborted) setHasFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [projectId, specsUpdatedAt, refreshKey]);

  return { specs, hasFailed };
}
