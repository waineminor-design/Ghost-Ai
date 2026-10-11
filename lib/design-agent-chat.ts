import "server-only";

import {
  appendAiChatMessage,
  normalizeAiChatContent,
  type AiChatMessage,
} from "@/lib/ai-chat";
import { AI_USER } from "@/lib/ai-user";
import { getLiveblocks } from "@/lib/liveblocks";

// Posts a Ghost AI reply to the room's AI Architect chat (`aiChat`), which
// everyone in the project sees, for the design agent. The text is trimmed
// and capped like every chat message; blank text posts nothing. Creates the
// chat on the first message and keeps only the newest messages, like the
// sidebar does. Returns the stored message, or null when nothing was posted.
export async function appendAssistantMessage(
  roomId: string,
  content: string,
  runId?: string,
): Promise<AiChatMessage | null> {
  const text = normalizeAiChatContent(content);
  if (!text) return null;

  const message: AiChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
    authorId: AI_USER.id,
    authorName: AI_USER.info.name,
    createdAt: new Date().toISOString(),
    ...(runId !== undefined && { runId }),
  };
  await getLiveblocks().mutateStorage(roomId, ({ root }) => {
    appendAiChatMessage(root, message);
  });
  return message;
}
