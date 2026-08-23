import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import {
  coerceReviewDetailTabToVisible,
  resolveReviewDetailTabForVisit,
  resolveReviewDetailVisibleTabs,
  type ResolveReviewDetailVisibleTabsInput,
  type ReviewDetailVisibleTabs,
} from "@/lib/resolve-review-detail-visible-tabs";
import {
  REVIEW_DETAIL_DEFAULT_TAB,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/** Primary create-home tabs — canonical `reviewTab` ids (TB-2367). */
export const CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS = [
  "overview",
  "architecture",
  "decisions-remediation",
  "findings",
  "evidence",
  "policies",
  "activity",
] as const satisfies readonly ReviewDetailTabId[];

export type ReviewWorkspaceVisibleTabs = ReviewDetailVisibleTabs;

export type ResolveReviewWorkspaceVisibleTabsInput = ResolveReviewDetailVisibleTabsInput & {
  readonly lifecycle: ReviewWorkspaceLifecycle;
};

function createHomeVisibleTabs(): ReviewWorkspaceVisibleTabs {
  return {
    stage: "draft",
    visibleTabIds: CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS,
    advancedCollapsedTabIds: [],
    defaultTabId: REVIEW_DETAIL_DEFAULT_TAB,
  };
}

/** Lifecycle-aware visible tab sets for the unified review workspace shell (TB-2367). */
export function resolveReviewWorkspaceVisibleTabs(
  input: ResolveReviewWorkspaceVisibleTabsInput,
): ReviewWorkspaceVisibleTabs {
  if (input.lifecycle === "create-home") {
    return createHomeVisibleTabs();
  }

  return resolveReviewDetailVisibleTabs(input);
}

export function resolveReviewWorkspaceTabForVisit(
  paramValue: string | null | undefined,
  resolved: ReviewWorkspaceVisibleTabs,
  lifecycle: ReviewWorkspaceLifecycle,
): ReviewDetailTabId {
  if (lifecycle === "create-home") {
    return resolveReviewDetailTabForVisit(paramValue, resolved);
  }

  return resolveReviewDetailTabForVisit(paramValue, resolved);
}

export function coerceReviewWorkspaceTabToVisible(
  tabId: ReviewDetailTabId,
  resolved: ReviewWorkspaceVisibleTabs,
): ReviewDetailTabId {
  return coerceReviewDetailTabToVisible(tabId, resolved);
}
