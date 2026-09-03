import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  REVIEW_DETAIL_TAB_LABELS,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/** Lifecycle-aware tab labels — same `reviewTab` id uses one label across create-home and committed (PT-04). */
export function resolveReviewWorkspaceTabLabel(
  lifecycle: ReviewWorkspaceLifecycle,
  tabId: ReviewDetailTabId,
): string {
  void lifecycle;

  return REVIEW_DETAIL_TAB_LABELS[tabId];
}
