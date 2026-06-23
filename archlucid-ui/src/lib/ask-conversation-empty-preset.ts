import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

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

/** Ask page when no review packages exist and the workspace cannot auto-select a sample review. */
export const ASK_NO_REVIEW_PACKAGE_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-no-review-empty-state",
  title: "No review package available",
  description: "Create or load a review package before asking questions.",
  actions: [
    { label: "Start review", href: "/reviews/new", variant: "primary" },
    {
      label: "Load sample workspace",
      href: `/graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline",
    },
  ],
};
