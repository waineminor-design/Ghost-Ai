import { createContext, use } from "react";

type PresenceSlot = {
  // The navbar element the avatar stack is portaled into; null until the
  // navbar's workspace actions mount (and outside a workspace).
  slot: HTMLElement | null;
};

// Lets the canvas room render the avatar stack into the navbar owned by
// EditorShell. The stack reads the room's presence, so it has to render
// inside the RoomProvider, which lives in the workspace page.
export const PresenceSlotContext = createContext<PresenceSlot | null>(null);

export function usePresenceSlot(): HTMLElement | null {
  const state = use(PresenceSlotContext);
  if (!state) {
    throw new Error("usePresenceSlot must be used inside EditorShell");
  }
  return state.slot;
}
