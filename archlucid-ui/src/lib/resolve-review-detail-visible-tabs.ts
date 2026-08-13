import {
  REVIEW_DETAIL_DEFAULT_TAB,
  REVIEW_DETAIL_TAB_IDS,
  isReviewDetailTabId,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/**
 * Coarse package-detail lifecycle for tab density (TB-2189).
 * Mirrors TB-2175 signals: progress → completed → committed (manifest present).
 */
export type ReviewDetailTabLifecycleStage =
  | "draft"
  | "analysis-in-progress"
  | "pre-commit-complete"
  | "committed";

export type ResolveReviewDetailVisibleTabsInput = {
  readonly manifestId: string | null | undefined;
  readonly showProgressTracker: boolean;
  readonly runCompleted: boolean;
};

export type ReviewDetailVisibleTabs = {
  readonly stage: ReviewDetailTabLifecycleStage;
  /** Always shown in the primary tab strip. */
  readonly visibleTabIds: readonly ReviewDetailTabId[];
  /** Available under "More sections" so deep links still work. */
  readonly advancedCollapsedTabIds: readonly ReviewDetailTabId[];
  readonly defaultTabId: ReviewDetailTabId;
};

const ALL_TABS: readonly ReviewDetailTabId[] = REVIEW_DETAIL_TAB_IDS;

function hasManifest(manifestId: string | null | undefined): boolean {
  return (manifestId ?? "").trim().length > 0;
}

export function resolveReviewDetailTabLifecycleStage(
  input: ResolveReviewDetailVisibleTabsInput,
): ReviewDetailTabLifecycleStage {
  if (hasManifest(input.manifestId)) {
    return "committed";
  }

  if (input.showProgressTracker) {
    return "analysis-in-progress";
  }

  if (input.runCompleted) {
    return "pre-commit-complete";
  }

  return "draft";
}

/** High-frequency tabs — architecture, policies, signed record, and decisions stay under More. */
const PRIMARY_REVIEW_DETAIL_TAB_IDS: readonly ReviewDetailTabId[] = [
  "overview",
  "findings",
  "evidence",
  "activity",
];

function primaryTabsForStage(_stage: ReviewDetailTabLifecycleStage): readonly ReviewDetailTabId[] {
  return PRIMARY_REVIEW_DETAIL_TAB_IDS;
}

function defaultTabForStage(stage: ReviewDetailTabLifecycleStage): ReviewDetailTabId {
  switch (stage) {
    case "draft":
      return "overview";
    case "analysis-in-progress":
      // Progress (stage, elapsed, duration band) only renders on Activity, so landing on Overview
      // during analysis hides the one thing the reader came back to check.
      return "activity";
    case "pre-commit-complete":
      return "findings";
    case "committed":
      return "review-package";
    default: {
      const _exhaustive: never = stage;

      return _exhaustive;
    }
  }
}

function advancedTabsForStage(
  _stage: ReviewDetailTabLifecycleStage,
  primary: readonly ReviewDetailTabId[],
): readonly ReviewDetailTabId[] {
  const primarySet = new Set<ReviewDetailTabId>(primary);

  return ALL_TABS.filter((tabId) => !primarySet.has(tabId));
}

export function resolveReviewDetailVisibleTabs(
  input: ResolveReviewDetailVisibleTabsInput,
): ReviewDetailVisibleTabs {
  const stage = resolveReviewDetailTabLifecycleStage(input);
  const visibleTabIds = primaryTabsForStage(stage);
  const advancedCollapsedTabIds = advancedTabsForStage(stage, visibleTabIds);
  const defaultTabId = defaultTabForStage(stage);

  return {
    stage,
    visibleTabIds,
    advancedCollapsedTabIds,
    defaultTabId,
  };
}

/** Keep deep-linked tabs; otherwise fall back to the stage default. */
export function coerceReviewDetailTabToVisible(
  tabId: ReviewDetailTabId,
  resolved: ReviewDetailVisibleTabs,
): ReviewDetailTabId {
  if (resolved.visibleTabIds.includes(tabId) || resolved.advancedCollapsedTabIds.includes(tabId)) {
    return tabId;
  }

  if (resolved.visibleTabIds.includes(resolved.defaultTabId)) {
    return resolved.defaultTabId;
  }

  return resolved.visibleTabIds[0] ?? REVIEW_DETAIL_DEFAULT_TAB;
}

/**
 * Effective tab for a visit that may not name one.
 *
 * `resolveReviewDetailTab` collapses an absent `reviewTab` to "overview", which is indistinguishable
 * from an explicit request for Overview. Because Overview is visible at every stage,
 * `coerceReviewDetailTabToVisible` always kept it and the per-stage `defaultTabId` never applied.
 * Passing the raw param through here keeps "unspecified" separate from "asked for Overview".
 */
export function resolveReviewDetailTabForVisit(
  paramValue: string | null | undefined,
  resolved: ReviewDetailVisibleTabs,
): ReviewDetailTabId {
  if (!isReviewDetailTabId(paramValue)) {
    return resolved.defaultTabId;
  }

  return coerceReviewDetailTabToVisible(paramValue, resolved);
}

export function isReviewDetailTabAdvanced(
  tabId: ReviewDetailTabId,
  resolved: ReviewDetailVisibleTabs,
): boolean {
  return resolved.advancedCollapsedTabIds.includes(tabId);
}