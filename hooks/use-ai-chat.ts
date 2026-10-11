import { useMemo, useState } from "react";
// The regular (non-suspense) hooks: the AI sidebar renders while the room
// is still connecting, and must not suspend. Until storage has loaded the
// chat reads as empty and nothing can be sent.
import { shallow, useMutation, useRoom, useSelf, useStorage } from "@liveblocks/react";

import {
  appendAiChatMessage,
  normalizeAiChatContent,
  parseAiChatMessages,
  type AiChatMessage,
} from "@/lib/ai-chat";

// Same reference every time, so a room without a chat doesn't re-render
// the panel on every unrelated storage change.
const NO_MESSAGES: readonly never[] = [];

export interface AiChat {
  messages: AiChatMessage[];
  // Clerk id of the signed-in user, to tell their own messages apart; null
  // until the room has connected.
  selfId: string | null;
  draft: string;
  setDraft: (draft: string) => void;
  // False while the draft is blank or the room isn't ready.
  canSend: boolean;
  send: () => void;
}

// The AI Architect chat, owned by AiSidebar. Messages live in the room's
// `aiChat` storage, so everyone in the project sees the same conversation
// in real time and it survives a reload; the draft stays local, so it
// survives switching tabs. Sending stays out of the undo history, so the
// canvas Undo never removes a chat message. Ghost AI doesn't reply here
// yet. Must be used inside a RoomProvider.
export function useAiChat(): AiChat {
  // null until storage has loaded; NO_MESSAGES for a room without a chat.
  const stored = useStorage((root) => root.aiChat ?? NO_MESSAGES);
  const messages = useMemo(() => parseAiChatMessages(stored), [stored]);
  const self = useSelf((me) => ({ id: me.id, name: me.info.name }), shallow);
  const [draft, setDraft] = useState("");
  const room = useRoom();
  const content = normalizeAiChatContent(draft);
  const canSend = content !== "" && stored !== null && self !== null;

  const appendMessage = useMutation(({ storage }, message: AiChatMessage) => {
    appendAiChatMessage(storage, message);
  }, []);

  function send() {
    if (!canSend) return;
    const message: AiChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      authorId: self.id,
      authorName: self.name,
      createdAt: new Date().toISOString(),
    };
    room.history.disable(() => appendMessage(message));
    setDraft("");
  }

  return { messages, selfId: self?.id ?? null, draft, setDraft, canSend, send };
}
