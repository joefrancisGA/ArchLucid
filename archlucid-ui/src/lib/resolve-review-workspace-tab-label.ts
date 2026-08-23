import { ARCHITECTURE_WORKSPACE_TAB_LABELS } from "@/lib/architecture/architecture-workspace-tabs";
import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  REVIEW_DETAIL_TAB_LABELS,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import { mapReviewTabToArchitectureTab } from "@/lib/unified-review-workspace-tabs";

/** Lifecycle-aware tab labels — same `reviewTab` id, create-home vs committed copy (TB-2367). */
export function resolveReviewWorkspaceTabLabel(
  lifecycle: ReviewWorkspaceLifecycle,
  tabId: ReviewDetailTabId,
): string {
  if (lifecycle === "create-home") {
    const archTab = mapReviewTabToArchitectureTab(tabId);

    return ARCHITECTURE_WORKSPACE_TAB_LABELS[archTab];
  }

  return REVIEW_DETAIL_TAB_LABELS[tabId];
}
