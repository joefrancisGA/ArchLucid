import type { RunSummary } from "@/types/authority";
import type { ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";

import {
  REVIEWS_HUB_FILTER_FINALIZED_LABEL,
  REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL,
  REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import type { ReviewsHubOverallStatus } from "./reviews-hub-review-status";

export type ReviewFilterId =
  | "all"
  | "needs-attention"
  | "updated-recently"
  | "finalized"
  | ReviewsHubOverallStatus;

export const PRIMARY_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-attention", label: REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL },
  { id: "finalized", label: REVIEWS_HUB_FILTER_FINALIZED_LABEL },
  { id: "updated-recently", label: REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL },
];

export const MORE_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "Draft", label: "Draft" },
  { id: "Active", label: "Active" },
  { id: "Awaiting approval", label: "Awaiting approval" },
  { id: "Archived", label: "Archived" },
];

export function matchesSearch(
  run: RunSummary,
  query: string,
  ownerContext: ReviewPackageOwnerResolutionContext,
  siblingRuns: readonly RunSummary[],
): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const row = toReviewsHubReviewRowDisplay(run, ownerContext, siblingRuns);
  const haystack = [
    row.reviewTitle,
    row.reviewTitlePrimary,
    row.architectureName,
    row.ownerLabel,
    run.runId,
    run.displayName ?? "",
    run.description ?? "",
    run.projectId,
    run.requestId ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function matchesFilter(
  run: RunSummary,
  filter: ReviewFilterId,
  ownerContext: ReviewPackageOwnerResolutionContext,
  siblingRuns: readonly RunSummary[],
): boolean {
  const row = toReviewsHubReviewRowDisplay(run, ownerContext, siblingRuns);

  if (filter === "all") {
    return true;
  }

  if (filter === "needs-attention") {
    return row.needsAttention;
  }

  if (filter === "finalized") {
    return row.overallStatus === "Finalized";
  }

  if (filter === "updated-recently") {
    const updatedAt = new Date(run.createdUtc).getTime();

    if (Number.isNaN(updatedAt)) {
      return false;
    }

    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    return Date.now() - updatedAt <= fourteenDaysMs;
  }

  return row.overallStatus === filter;
}

export function mergeRunsWithArchivedCache(
  runs: readonly RunSummary[],
  archivedRuns: readonly RunSummary[],
): RunSummary[] {
  const byId = new Map<string, RunSummary>();

  for (const run of runs) {
    byId.set(run.runId, run);
  }

  for (const archivedRun of archivedRuns) {
    if (!byId.has(archivedRun.runId)) {
      byId.set(archivedRun.runId, archivedRun);
    }
  }

  return [...byId.values()];
}

export function isArchivedRun(run: RunSummary): boolean {
  return run.isArchived === true;
}

export function sortRunsForInventory(
  runs: readonly RunSummary[],
  isFavorite: (runId: string) => boolean,
): RunSummary[] {
  return [...runs].sort((left, right) => {
    const leftPinned = isFavorite(left.runId) ? 0 : 1;
    const rightPinned = isFavorite(right.runId) ? 0 : 1;

    if (leftPinned !== rightPinned) {
      return leftPinned - rightPinned;
    }

    const leftUpdated = new Date(left.createdUtc).getTime();
    const rightUpdated = new Date(right.createdUtc).getTime();

    if (!Number.isNaN(leftUpdated) && !Number.isNaN(rightUpdated) && leftUpdated !== rightUpdated) {
      return rightUpdated - leftUpdated;
    }

    return left.runId.localeCompare(right.runId);
  });
}

export function emptyInventoryDescription(draftCount: number): string {
  if (draftCount === 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY;
  }

  if (draftCount > 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY;
  }

  return REVIEWS_HUB_RECENT_EMPTY_BODY;
}
