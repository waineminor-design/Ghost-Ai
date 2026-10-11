import { createContext, use } from "react";

type TemplatesDialogState = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

// Lets the canvas render the templates dialog whose open state is owned by
// EditorShell (the Templates button lives in the navbar). The dialog has
// to render inside the canvas, because importing writes to the room's
// storage and fits the canvas view.
export const TemplatesDialogContext = createContext<TemplatesDialogState | null>(null);

export function useTemplatesDialogState(): TemplatesDialogState {
  const state = use(TemplatesDialogContext);
  if (!state) {
    throw new Error("useTemplatesDialogState must be used inside EditorShell");
  }
  return state;
}
