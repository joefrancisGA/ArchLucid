import {
  REVIEW_DETAIL_TAB_IDS,
  REVIEW_DETAIL_TAB_LABELS,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/** High-frequency review workspace tabs — always visible in the tab row. */
export const REVIEW_DETAIL_PRIMARY_TAB_IDS = [
  "overview",
  "findings",
  "evidence",
  "activity",
] as const satisfies readonly ReviewDetailTabId[];

/** Less-frequent destinations grouped under an explicit More control. */
export const REVIEW_DETAIL_OVERFLOW_TAB_IDS = [
  "policies",
  "architecture",
  "decisions-remediation",
  "review-package",
] as const satisfies readonly ReviewDetailTabId[];

export type ReviewDetailPrimaryTabId = (typeof REVIEW_DETAIL_PRIMARY_TAB_IDS)[number];
export type ReviewDetailOverflowTabId = (typeof REVIEW_DETAIL_OVERFLOW_TAB_IDS)[number];

export function isReviewDetailOverflowTabId(tabId: ReviewDetailTabId): tabId is ReviewDetailOverflowTabId {
  return (REVIEW_DETAIL_OVERFLOW_TAB_IDS as readonly string[]).includes(tabId);
}

export function reviewDetailTabLabel(tabId: ReviewDetailTabId): string {
  return REVIEW_DETAIL_TAB_LABELS[tabId];
}

export function allReviewDetailTabIds(): readonly ReviewDetailTabId[] {
  return REVIEW_DETAIL_TAB_IDS;
}
