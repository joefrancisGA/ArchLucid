import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Shown in Ask ArchLucid when a thread has no messages yet. */
export const ASK_CONVERSATION_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-conversation-empty-state",
  title: "No messages yet",
  description:
    "Ask a question to search evidence across this workspace, or pick a review above to narrow scope. Follow-ups continue the same conversation.",
};

/** Shown when the thread history panel has no saved conversations. */
export const ASK_THREAD_HISTORY_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-thread-history-empty-state",
  title: "No saved conversations yet",
  description: "Ask a review question to start a thread. Saved questions appear here for quick resume.",
  actions: [{ label: "View reviews", href: "/architecture/reviews", variant: "primary" }],
};

/** Ask page when no reviews exist and the workspace cannot auto-select a sample review. */
export const ASK_NO_REVIEW_PACKAGE_EMPTY: EnterpriseCompactEmptyStateProps = {
  testId: "ask-no-review-empty-state",
  title: "No review available",
  description: "Create or load a review before asking questions.",
  actions: [
    { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH, variant: "primary" },
    {
      label: "Load sample workspace",
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline",
    },
  ],
};
