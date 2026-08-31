import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import type { ReviewDetailTabLifecycleStage } from "@/lib/resolve-review-detail-visible-tabs";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/** Unified packages list — reviews hub includes architecture drafts (TB usability consolidation). */
export const PACKAGES_NAV_LABEL = "Packages" as const;

export const PACKAGES_NAV_HREF = REVIEWS_LIST_PATH;

/** Single governance inbox aggregating attention queues. */
export const NEEDS_ATTENTION_INBOX_PATH = "/governance/needs-attention" as const;

export const NEEDS_ATTENTION_INBOX_LABEL = "Needs attention" as const;

/** Outcomes hub entry — sponsor report tab strip covers ROI, scorecard, and workspace health. */
export const OUTCOMES_HUB_NAV_LABEL = "Outcomes" as const;

export const OUTCOMES_HUB_PATH = SPONSOR_REPORT_PATH;

/** Consolidated first-run surface label (First review guide + getting started). */
export const FIRST_RUN_GUIDE_NAV_LABEL = "Getting started" as const;

export const FIRST_RUN_GUIDE_NAV_PATH = FIRST_REVIEW_GUIDE_PATH;

/** Default sponsor-relevant findings shown before "Show all". */
export const PRIORITY_FINDINGS_DISPLAY_LIMIT = 5;

/** Primary job tabs per lifecycle stage — remainder sit in More sections. */
export const REVIEW_WORKSPACE_PRIMARY_TABS_BY_STAGE: Readonly<
  Record<ReviewDetailTabLifecycleStage, readonly ReviewDetailTabId[]>
> = {
  draft: ["overview", "architecture", "findings"],
  "analysis-in-progress": ["activity", "findings", "overview"],
  "pre-commit-complete": ["findings", "overview", "decisions-remediation"],
  committed: ["review-package", "findings", "overview"],
};

export type ReviewWorkspaceTabSplit = {
  readonly primaryTabIds: readonly ReviewDetailTabId[];
  readonly moreTabIds: readonly ReviewDetailTabId[];
};

export function splitReviewWorkspaceTabsByStage(
  stage: ReviewDetailTabLifecycleStage,
  allTabIds: readonly ReviewDetailTabId[],
): ReviewWorkspaceTabSplit {
  const primaryOrder = REVIEW_WORKSPACE_PRIMARY_TABS_BY_STAGE[stage];
  const primarySet = new Set<ReviewDetailTabId>(primaryOrder);
  const primaryTabIds = primaryOrder.filter((tabId) => allTabIds.includes(tabId));
  const moreTabIds = allTabIds.filter((tabId) => !primarySet.has(tabId));

  return {
    primaryTabIds,
    moreTabIds,
  };
}

export function reviewWorkspaceTabsIncludeTab(
  resolved: ReviewWorkspaceTabSplit,
  tabId: ReviewDetailTabId,
): boolean {
  return resolved.primaryTabIds.includes(tabId) || resolved.moreTabIds.includes(tabId);
}
