import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

import {
  AiChatComposer,
  type AiChatComposerHandle,
} from "@/components/editor/ai-chat-composer";
import { AiStatusLine } from "@/components/editor/ai-status-line";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AiChat } from "@/hooks/use-ai-chat";
import { useAiStatus } from "@/hooks/use-ai-status";
import type { AiChatMessage } from "@/lib/ai-chat";
import { AI_USER } from "@/lib/ai-user";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design a URL shortener",
  "Real-time chat app",
  "E-commerce checkout",
  "Video streaming platform",
];

// The AI Architect tab: the room's AI status line, then the room's shared
// messages (or the intro and starter prompts while empty) above the
// composer. The chat state comes from AiSidebar. While a design run is
// active the composer is locked for everyone in the room. Must render
// inside a RoomProvider.
export function AiChatPanel({ chat }: { chat: AiChat }) {
  const composerRef = useRef<AiChatComposerHandle>(null);
  const aiStatus = useAiStatus();
  const isAiWorking = aiStatus.kind === "active";

  function fillComposer(prompt: string) {
    chat.setDraft(prompt);
    composerRef.current?.focus();
  }

  return (
    <>
      <AiStatusLine status={aiStatus} />
      {chat.messages.length === 0 ? (
        <EmptyState onPickPrompt={fillComposer} />
      ) : (
        <MessageList messages={chat.messages} selfId={chat.selfId} />
      )}
      <AiChatComposer
        ref={composerRef}
        value={chat.draft}
        onChange={chat.setDraft}
        canSend={chat.canSend}
        onSend={chat.send}
        isLocked={isAiWorking}
      />
    </>
  );
}

function EmptyState({ onPickPrompt }: { onPickPrompt: (prompt: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
        <Sparkles className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Describe a system and I&apos;ll design it on the canvas.
        </p>
        {/* Until the design agent replies in the chat, say so before
            people spend time on a prompt. */}
        <p className="text-xs text-muted-foreground">
          Messages are shared with everyone in this project. Ghost AI
          doesn&apos;t reply yet: AI replies arrive in the next step.
        </p>
      </div>
      <ul aria-label="Starter prompts" className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <Button variant="outline" size="sm" onClick={() => onPickPrompt(prompt)}>
              {prompt}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageList({
  messages,
  selfId,
}: {
  messages: AiChatMessage[];
  selfId: string | null;
}) {
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the newest message in view. Scrolls the ScrollArea's own viewport
  // (not scrollIntoView, which could also scroll the editor around it).
  useEffect(() => {
    const viewport = listRef.current?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <ol ref={listRef} role="log" aria-label="Messages" className="flex flex-col gap-3 p-3">
        {messages.map((message) => (
          <li key={message.id}>
            <MessageBubble
              message={message}
              isOwn={selfId !== null && message.authorId === selfId}
            />
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}

// User messages on the right under the author's name ("You" for your
// own), Ghost AI's on the left after its icon, under "Ghost AI".
function MessageBubble({ message, isOwn }: { message: AiChatMessage; isOwn: boolean }) {
  const isUser = message.role === "user";
  const author = isUser ? (isOwn ? "You" : message.authorName) : AI_USER.info.name;

  return (
    <div className={cn("flex items-start gap-2", isUser && "justify-end")}>
      {!isUser && (
        <div
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground"
        >
          <Sparkles className="size-3.5" />
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[85%] min-w-0 flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <p className="max-w-full truncate text-xs text-muted-foreground">{author}</p>
        <p
          className={cn(
            "max-w-full rounded-lg px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
