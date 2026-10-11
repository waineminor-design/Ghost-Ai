import { useEffect, useState } from "react";
// The regular (non-suspense) hook: the AI sidebar renders while the room
// is still connecting, and must not suspend. Storage that hasn't loaded
// reads as null, so as idle.
import { useStorage } from "@liveblocks/react";

import {
  getAiStatusView,
  getAiStatusVisibleUntil,
  parseAiStatus,
  type AiStatusView,
} from "@/lib/ai-status";

// The room's AI status as it should be shown now: the design agent writes
// it to room storage, so everyone in the project sees the same thing.
// Re-renders by itself when a "done" / "failed" status should disappear
// (~10 s) or an unfinished one goes stale (3 min). Must render inside a
// RoomProvider.
export function useAiStatus(): AiStatusView {
  const status = parseAiStatus(useStorage((root) => root.aiStatus));
  // The time the view is computed for; moved forward by the timer below.
  const [now, setNow] = useState(Date.now);

  const visibleUntil = getAiStatusVisibleUntil(status);
  useEffect(() => {
    if (visibleUntil === null) return;
    // Also fires at once for a status that is already past its time, so
    // `now` never lags behind a newly arrived status. At least
    // `visibleUntil`, in case the timer fires early or the clock is coarse.
    const timer = setTimeout(
      () => setNow(Math.max(Date.now(), visibleUntil)),
      Math.max(0, visibleUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [visibleUntil]);

  return getAiStatusView(status, now);
}
