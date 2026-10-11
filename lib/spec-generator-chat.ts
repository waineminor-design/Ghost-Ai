import "server-only";

import { parseAiChatMessages, type AiChatMessage } from "@/lib/ai-chat";
import { getLiveblocks } from "@/lib/liveblocks";

// The spec generator's view of the room's AI Architect chat (`aiChat`):
// the discussion behind the diagram, given to the model as extra context.

// How many of the newest messages the spec generator reads.
export const SPEC_CHAT_CONTEXT_MESSAGES = 50;

// The room's newest chat messages, oldest first (room id = project id).
// Storage is external input: a room without a chat, or with a malformed
// one, reads as no messages and malformed messages are skipped.
export async function readRecentChatMessages(
  roomId: string,
  limit = SPEC_CHAT_CONTEXT_MESSAGES,
): Promise<AiChatMessage[]> {
  const document: unknown = await getLiveblocks().getStorageDocument(roomId, "json");
  const chat =
    typeof document === "object" && document !== null
      ? (document as Record<string, unknown>).aiChat
      : undefined;
  return parseAiChatMessages(chat).slice(-limit);
}

// One block per message, oldest first, with who wrote it.
export function describeChat(messages: AiChatMessage[]): string {
  if (messages.length === 0) return "The chat is empty.";
  return messages
    .map((message) => {
      const author =
        message.role === "assistant" ? "Ghost AI" : `${message.authorName || "A user"} (user)`;
      return `${author}:\n${message.content}`;
    })
    .join("\n\n");
}
