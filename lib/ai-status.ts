// The AI status shared through room storage (`aiStatus`): the design agent
// writes it, and everyone in the room reads it for the AI sidebar's status
// line and the composer lock. Used on both the server and the client.

export const AI_STATUS_STEPS = [
  "idle",
  "started",
  "thinking",
  "applying",
  "done",
  "failed",
] as const;

export type AiStatusStep = (typeof AI_STATUS_STEPS)[number];

export type AiStatus = {
  step: AiStatusStep;
  message: string;
  // Trigger.dev run id; null when no run is involved.
  runId: string | null;
  // Name of the person who started the run; null when unknown.
  startedBy: string | null;
  // ISO timestamp.
  updatedAt: string;
};

// A status not updated for this long counts as idle, so a worker that
// crashed mid-run can't leave the room locked.
export const AI_STATUS_STALE_MS = 3 * 60_000;
// How long "done" / "failed" stays visible after it was written.
export const AI_STATUS_FINISHED_VISIBLE_MS = 10_000;

const ACTIVE_STEPS: ReadonlySet<AiStatusStep> = new Set(["started", "thinking", "applying"]);

// What the room should show for a status at time `now` (ms):
// "active" while a run is working (spinner, composer locked), "done" /
// "failed" briefly after it ends, otherwise "hidden". A missing status
// (a room that never had a run) is idle, so hidden.
export type AiStatusView =
  | { kind: "hidden" }
  | { kind: "active"; message: string; startedBy: string | null }
  | { kind: "done" | "failed"; message: string };

export function getAiStatusView(status: AiStatus | null, now: number): AiStatusView {
  const until = getAiStatusVisibleUntil(status);
  if (!status || until === null || now >= until) return { kind: "hidden" };
  if (ACTIVE_STEPS.has(status.step)) {
    return { kind: "active", message: status.message, startedBy: status.startedBy };
  }
  if (status.step === "done" || status.step === "failed") {
    return { kind: status.step, message: status.message };
  }
  return { kind: "hidden" };
}

// When the status stops being shown (ms), or null if it never is.
export function getAiStatusVisibleUntil(status: AiStatus | null): number | null {
  if (!status) return null;
  const updatedAt = Date.parse(status.updatedAt);
  if (Number.isNaN(updatedAt)) return null;
  if (ACTIVE_STEPS.has(status.step)) return updatedAt + AI_STATUS_STALE_MS;
  if (status.step === "done" || status.step === "failed") {
    return updatedAt + AI_STATUS_FINISHED_VISIBLE_MS;
  }
  return null;
}

// Room storage is writable by every client in the room, so it is checked
// before use: anything that isn't a well-formed status counts as missing.
export function parseAiStatus(value: unknown): AiStatus | null {
  if (typeof value !== "object" || value === null) return null;
  const { step, message, runId, startedBy, updatedAt } = value as Record<string, unknown>;
  if (!AI_STATUS_STEPS.includes(step as AiStatusStep)) return null;
  if (typeof message !== "string" || typeof updatedAt !== "string") return null;
  if (runId !== null && typeof runId !== "string") return null;
  if (startedBy !== null && typeof startedBy !== "string") return null;
  return { step: step as AiStatusStep, message, runId, startedBy, updatedAt };
}
