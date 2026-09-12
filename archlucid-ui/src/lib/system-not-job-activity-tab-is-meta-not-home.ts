import {
  REVIEW_DETAIL_DEFAULT_TAB,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import type { ReviewDetailTabLifecycleStage } from "@/lib/resolve-review-detail-visible-tabs";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_OWNER = "SN-022" as const;

/** Working desk must not default to Activity — meta belongs behind an explicit tab click. */
export const WORKING_REVIEW_DETAIL_BANNED_DEFAULT_TABS: readonly ReviewDetailTabId[] = ["activity"];

/** Surfaces that resolve stage defaults for the unified review workspace shell. */
export const SYSTEM_NOT_JOB_WORKING_REVIEW_DETAIL_DEFAULT_TAB_SURFACES: readonly string[] = [
  "archlucid-ui/src/lib/resolve-review-detail-visible-tabs.ts",
  "archlucid-ui/src/lib/resolve-review-workspace-visible-tabs.ts",
  "archlucid-ui/src/hooks/use-resolved-review-detail-active-tab.ts",
];

/**
 * SN-022 / ADR 0079 — Working review workspace defaults to overview/findings work tabs.
 * Activity remains visible but is never the implicit landing tab.
 */
export function resolveSystemNotJobWorkingReviewDetailDefaultTab(
  stage: ReviewDetailTabLifecycleStage,
): ReviewDetailTabId {
  switch (stage) {
    case "draft":
      return REVIEW_DETAIL_DEFAULT_TAB;
    case "analysis-in-progress":
      return REVIEW_DETAIL_DEFAULT_TAB;
    case "pre-commit-complete":
      return "findings";
    case "committed":
      return "findings";
    default: {
      const _exhaustive: never = stage;

      return _exhaustive;
    }
  }
}
