import { useEffect, useRef, useState } from "react";

import { requestErrorMessage, sendJsonRequest } from "@/lib/api-client";
import {
  isValidEmail,
  normalizeEmail,
  type CollaboratorProfile,
  type ProjectMembers,
} from "@/lib/collaborators";

export type CopyLinkStatus = "idle" | "copied" | "failed";

export interface ProjectShare {
  isOpen: boolean;
  // Null until the list has loaded (or when loading failed).
  members: ProjectMembers | null;
  isLoading: boolean;
  email: string;
  isEmailValid: boolean;
  isInviting: boolean;
  // Collaborator being removed; null when no removal is pending.
  removingId: string | null;
  // True while any share request is in flight.
  isPending: boolean;
  // Message from the last failed request.
  error: string | null;
  copyLinkStatus: CopyLinkStatus;
  setEmail: (email: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
  invite: () => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  copyLink: () => Promise<void>;
}

// How long the copy button shows "Copied!".
const COPIED_DURATION_MS = 2000;

// Owns the share dialog: open state, the member list, the invite form,
// pending and error state, and copy-link feedback. Requests are tied to
// the open dialog and aborted when it closes, so late responses never
// update a closed (or reopened) dialog.
export function useProjectShare(projectId: string): ProjectShare {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMembers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyLinkStatus, setCopyLinkStatus] = useState<CopyLinkStatus>("idle");

  // Aborted when the dialog closes or the component unmounts.
  const requestsRef = useRef<AbortController | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedEmail = normalizeEmail(email);
  const isEmailValid = isValidEmail(normalizedEmail);
  const isPending = isLoading || isInviting || removingId !== null;
  const collaboratorsUrl = `/api/projects/${encodeURIComponent(projectId)}/collaborators`;

  useEffect(() => {
    const requests = requestsRef;
    const copiedTimer = copiedTimerRef;
    return () => {
      requests.current?.abort();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  function resetCopyLink() {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = null;
    setCopyLinkStatus("idle");
  }

  async function loadMembers(signal: AbortSignal) {
    setIsLoading(true);
    try {
      const data = (await sendJsonRequest(collaboratorsUrl, {
        signal,
      })) as ProjectMembers;
      if (!signal.aborted) setMembers(data);
    } catch (err) {
      if (!signal.aborted) setError(requestErrorMessage(err));
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }

  function openDialog() {
    requestsRef.current?.abort();
    const controller = new AbortController();
    requestsRef.current = controller;

    setMembers(null);
    setEmail("");
    setError(null);
    setIsInviting(false);
    setRemovingId(null);
    resetCopyLink();
    setIsOpen(true);
    void loadMembers(controller.signal);
  }

  // Members stay in state so the content doesn't change during the exit
  // animation; openDialog resets them.
  function closeDialog() {
    requestsRef.current?.abort();
    requestsRef.current = null;
    resetCopyLink();
    setIsOpen(false);
  }

  async function invite() {
    const signal = requestsRef.current?.signal;
    if (!signal || !isEmailValid || isPending) return;

    setError(null);
    setIsInviting(true);
    try {
      const collaborator = (await sendJsonRequest(collaboratorsUrl, {
        method: "POST",
        body: { email: normalizedEmail },
        signal,
      })) as CollaboratorProfile;
      if (signal.aborted) return;
      setMembers(
        (current) =>
          current && {
            ...current,
            collaborators: [...current.collaborators, collaborator],
          },
      );
      setEmail("");
    } catch (err) {
      if (!signal.aborted) setError(requestErrorMessage(err));
    } finally {
      if (!signal.aborted) setIsInviting(false);
    }
  }

  async function removeCollaborator(collaboratorId: string) {
    const signal = requestsRef.current?.signal;
    if (!signal || isPending) return;

    setError(null);
    setRemovingId(collaboratorId);
    try {
      await sendJsonRequest(
        `${collaboratorsUrl}/${encodeURIComponent(collaboratorId)}`,
        { method: "DELETE", signal },
      );
      if (signal.aborted) return;
      setMembers(
        (current) =>
          current && {
            ...current,
            collaborators: current.collaborators.filter(
              (c) => c.id !== collaboratorId,
            ),
          },
      );
    } catch (err) {
      if (!signal.aborted) setError(requestErrorMessage(err));
    } finally {
      if (!signal.aborted) setRemovingId(null);
    }
  }

  async function copyLink() {
    const signal = requestsRef.current?.signal;
    if (!signal) return;

    resetCopyLink();
    const url = `${window.location.origin}/editor/${encodeURIComponent(projectId)}`;
    try {
      // `navigator.clipboard` is undefined outside secure contexts; the
      // resulting TypeError is handled as a failed copy.
      await navigator.clipboard.writeText(url);
      if (signal.aborted) return;
      setCopyLinkStatus("copied");
      copiedTimerRef.current = setTimeout(() => {
        copiedTimerRef.current = null;
        setCopyLinkStatus("idle");
      }, COPIED_DURATION_MS);
    } catch {
      if (!signal.aborted) setCopyLinkStatus("failed");
    }
  }

  return {
    isOpen,
    members,
    isLoading,
    email,
    isEmailValid,
    isInviting,
    removingId,
    isPending,
    error,
    copyLinkStatus,
    setEmail,
    openDialog,
    closeDialog,
    invite,
    removeCollaborator,
    copyLink,
  };
}
