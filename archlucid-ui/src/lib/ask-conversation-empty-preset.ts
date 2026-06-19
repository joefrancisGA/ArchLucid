import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";

/** Shown in Ask ArchLucid when a thread has no messages yet. */
export const ASK_CONVERSATION_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-conversation-empty-state",
  title: "No messages yet",
  description:
    "Select an architecture review for a new conversation (or open one on the left), then ask a question. Follow-ups continue the same conversation without selecting the review again.",
};

/** Shown when the thread history panel has no saved conversations. */
export const ASK_THREAD_HISTORY_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-thread-history-empty-state",
  title: "No saved conversations yet",
  description: "Ask a review question to start a thread. Saved questions appear here for quick resume.",
  actions: [{ label: "View reviews", href: "/reviews?projectId=default", variant: "primary" }],
};
