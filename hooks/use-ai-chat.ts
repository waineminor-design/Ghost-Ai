import { useState } from "react";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const PLACEHOLDER_REPLY = "AI design generation is coming soon.";

export interface AiChat {
  messages: AiChatMessage[];
  draft: string;
  setDraft: (draft: string) => void;
  // False while the draft is empty or only whitespace.
  canSend: boolean;
  send: () => void;
}

// Local state of the AI Architect chat, owned by AiSidebar so it survives
// switching tabs. No AI calls yet: each message gets a placeholder reply.
export function useAiChat(): AiChat {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const content = draft.trim();

  function send() {
    if (!content) return;
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "user", content },
      { id: crypto.randomUUID(), role: "assistant", content: PLACEHOLDER_REPLY },
    ]);
    setDraft("");
  }

  return { messages, draft, setDraft, canSend: content !== "", send };
}
