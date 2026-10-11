import { createContext, use } from "react";

type SaveSlot = {
  // The navbar element the Save button is portaled into; null until the
  // navbar mounts.
  slot: HTMLElement | null;
};

// Lets the canvas render the Save button into the navbar owned by
// EditorShell. The button saves the room's canvas, so it has to render
// inside the canvas, which lives in the workspace page.
export const SaveSlotContext = createContext<SaveSlot | null>(null);

export function useSaveSlot(): HTMLElement | null {
  const state = use(SaveSlotContext);
  if (!state) {
    throw new Error("useSaveSlot must be used inside EditorShell");
  }
  return state.slot;
}
