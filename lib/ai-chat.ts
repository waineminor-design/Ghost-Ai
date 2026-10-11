import { LiveList, LiveObject } from "@liveblocks/client";

// The AI Architect chat shared through room storage (`aiChat`): everyone in
// the project sees the same messages, and they survive a reload. People
// append their own messages from the browser; the design agent appends
// Ghost AI's replies through the Liveblocks Node client. Used on both the
// server and the client.

export type AiChatRole = "user" | "assistant";

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  content: string;
  // Clerk user id, or AI_USER.id ("ghost-ai") for Ghost AI.
  authorId: string;
  authorName: string;
  // ISO timestamp.
  createdAt: string;
  // Design agent run the message belongs to, when there is one.
  runId?: string;
};

// The room keeps only the newest messages; older ones are dropped.
export const AI_CHAT_MAX_MESSAGES = 200;
// Longer message text is cut to this many characters.
export const AI_CHAT_MAX_CONTENT_LENGTH = 4_000;

// Message text as it is stored: trimmed and capped. Counts characters
// (code points), so the cut never splits an emoji's surrogate pair.
export function normalizeAiChatContent(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= AI_CHAT_MAX_CONTENT_LENGTH) return trimmed;
  return Array.from(trimmed).slice(0, AI_CHAT_MAX_CONTENT_LENGTH).join("").trimEnd();
}

// Appends a message to the room's chat inside a storage mutation (a
// client `useMutation` or the Node client's `mutateStorage`), then drops
// the oldest messages past the cap. Creates the list on the first message
// (rooms start without it) and replaces a value that isn't a LiveList
// (clients can write storage too).
export function appendAiChatMessage(
  root: LiveObject<Liveblocks["Storage"]>,
  message: AiChatMessage,
): void {
  let chat = root.get("aiChat");
  if (!(chat instanceof LiveList)) {
    chat = new LiveList([]);
    root.set("aiChat", chat);
  }
  chat.push(new LiveObject(message));
  while (chat.length > AI_CHAT_MAX_MESSAGES) chat.delete(0);
}

// Room storage is writable by every client in the room, so the chat is
// checked before use: anything that isn't a list reads as no messages, and
// malformed messages are skipped. Two people sending at the cap at once can
// briefly leave one extra message, so only the newest are returned.
export function parseAiChatMessages(value: unknown): AiChatMessage[] {
  if (!Array.isArray(value)) return [];
  const messages: AiChatMessage[] = [];
  for (const item of value) {
    const message = parseAiChatMessage(item);
    if (message) messages.push(message);
  }
  return messages.slice(-AI_CHAT_MAX_MESSAGES);
}

function parseAiChatMessage(value: unknown): AiChatMessage | null {
  if (typeof value !== "object" || value === null) return null;
  const { id, role, content, authorId, authorName, createdAt, runId } = value as Record<
    string,
    unknown
  >;
  if (role !== "user" && role !== "assistant") return null;
  if (
    typeof id !== "string" ||
    typeof content !== "string" ||
    typeof authorId !== "string" ||
    typeof authorName !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  if (runId !== undefined && typeof runId !== "string") return null;
  return {
    id,
    role,
    content,
    authorId,
    authorName,
    createdAt,
    ...(runId !== undefined && { runId }),
  };
}
