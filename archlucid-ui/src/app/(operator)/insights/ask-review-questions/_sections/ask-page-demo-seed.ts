import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { tryStaticDemoConversationMessages } from "@/lib/ask-static-demo-messages";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";

export const DEMO_ASK_THREAD_ID = "thread-claims-intake-001";

export function createDemoAskThread(): ConversationThread {
  return {
    threadId: DEMO_ASK_THREAD_ID,
    tenantId: "demo",
    workspaceId: "demo",
    projectId: "default",
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    title: "Review briefing thread",
    createdUtc: "2026-01-12T10:06:00.000Z",
    lastUpdatedUtc: "2026-01-12T10:06:12.000Z",
  };
}

export type DemoAskSeedResult = {
  readonly threads: ConversationThread[];
  readonly messages: ConversationMessage[];
  readonly selectedThreadId: string;
};

export function trySeedDemoAskConversation(
  threadId: string = DEMO_ASK_THREAD_ID,
): DemoAskSeedResult | null {
  const seeded = tryStaticDemoConversationMessages(threadId);

  if (seeded === null) {
    return null;
  }

  return {
    threads: [createDemoAskThread()],
    messages: seeded,
    selectedThreadId: threadId,
  };
}
