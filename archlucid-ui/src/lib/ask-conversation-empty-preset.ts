import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";

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
export const ASK_NO_REVIEW_PACKAGE_EMPTY: EnterpriseCompactEmptyStateProps =
  buildInsightsFinalizedReviewPrerequisiteEmpty({ jobId: "ask", finalizedCount: 0 });