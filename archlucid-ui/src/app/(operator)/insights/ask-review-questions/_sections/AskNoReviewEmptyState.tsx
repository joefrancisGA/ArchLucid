import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ASK_NO_REVIEW_PACKAGE_EMPTY } from "@/lib/ask-conversation-empty-preset";

/** Focused Ask page empty state when no reviews are available to scope questions. */
export function AskNoReviewEmptyState() {
  return <EnterpriseCompactEmptyState {...ASK_NO_REVIEW_PACKAGE_EMPTY} />;
}
