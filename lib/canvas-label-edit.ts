import { useEffect } from "react";

// Starting a label edit from the keyboard. The canvas shortcuts send a
// request with the focused node's or edge's id; that node or edge opens its
// label editor, the same as on double-click.

const LABEL_EDIT_EVENT = "ghost:edit-canvas-label";

export function requestLabelEdit(id: string) {
  window.dispatchEvent(new CustomEvent<string>(LABEL_EDIT_EVENT, { detail: id }));
}

// `setIsEditing` is a state setter, so its identity is stable and the
// listener is only re-attached when the id changes.
export function useLabelEditRequest(
  id: string,
  setIsEditing: (isEditing: boolean) => void,
) {
  useEffect(() => {
    function handleRequest(event: Event) {
      if ((event as CustomEvent<string>).detail === id) setIsEditing(true);
    }

    window.addEventListener(LABEL_EDIT_EVENT, handleRequest);
    return () => window.removeEventListener(LABEL_EDIT_EVENT, handleRequest);
  }, [id, setIsEditing]);
}
