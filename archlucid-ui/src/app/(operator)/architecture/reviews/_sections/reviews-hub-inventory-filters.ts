import type { RunSummary } from "@/types/authority";
import type { ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";

import {
  REVIEWS_HUB_FILTER_FINALIZED_LABEL,
  REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL,
  REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
  WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY,
  WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import type { ReviewsHubOverallStatus } from "./reviews-hub-review-status";

export type ReviewFilterId =
  | "all"
  | "needs-attention"
  | "updated-recently"
  | "finalized"
  | ReviewsHubOverallStatus;

export const INVENTORY_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-attention", label: REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL },
  { id: "finalized", label: REVIEWS_HUB_FILTER_FINALIZED_LABEL },
  { id: "updated-recently", label: REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL },
  { id: "Draft", label: "Draft" },
  { id: "Active", label: "Active" },
  { id: "Awaiting approval", label: "Awaiting approval" },
  { id: "Archived", label: "Archived" },
];

const INVENTORY_FILTER_IDS = new Set<string>(INVENTORY_FILTER_OPTIONS.map((option) => option.id));

/** Parses `?filter=` from the reviews hub URL; unknown values fall back to All. */
export function parseReviewsHubInventoryFilter(raw: string | null | undefined): ReviewFilterId {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!INVENTORY_FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as ReviewFilterId;
}

/** Shareable reviews-hub inventory href for a filter chip. */
export function reviewsHubInventoryFilterHref(filter: ReviewFilterId): string {
  if (filter === "all") {
    return "/architecture/reviews";
  }

  return `/architecture/reviews?filter=${encodeURIComponent(filter)}`;
}

export function reviewsHubInventoryHrefFromSearch(
  currentSearch: string,
  filter: ReviewFilterId,
  pathname: string = "/architecture/reviews",
): string {
  const params = new URLSearchParams(currentSearch);

  if (filter === "all") {
    params.delete("filter");
  } else {
    params.set("filter", filter);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export const REVIEWS_HUB_INVENTORY_SEARCH_PARAM = "q";

/** Parses `?q=` from the reviews hub URL. */
export function parseReviewsHubInventorySearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function reviewsHubInventorySearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = "/architecture/reviews",
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(REVIEWS_HUB_INVENTORY_SEARCH_PARAM);
  } else {
    params.set(REVIEWS_HUB_INVENTORY_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

/** Clears inventory filter and search while preserving unrelated query params. */
export function reviewsHubInventoryClearFiltersHrefFromSearch(
  currentSearch: string,
  pathname: string = "/architecture/reviews",
): string {
  const params = new URLSearchParams(currentSearch);
  params.delete("filter");
  params.delete(REVIEWS_HUB_INVENTORY_SEARCH_PARAM);
  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function resolveInventoryFilterCountRuns(
  filter: ReviewFilterId,
  mergedRuns: readonly RunSummary[],
  visibilityFilteredRuns: readonly RunSummary[],
): readonly RunSummary[] {
  if (filter === "Archived") {
    return mergedRuns;
  }

  return visibilityFilteredRuns;
}

export function countRunsMatchingInventoryFilter(
  runs: readonly RunSummary[],
  filter: ReviewFilterId,
  ownerContext: ReviewPackageOwnerResolutionContext,
  siblingRuns: readonly RunSummary[],
): number {
  return runs.filter((run) => matchesFilter(run, filter, ownerContext, siblingRuns)).length;
}

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
  return [...runs].sort((left, right) => compareRunsForInventory(left, right, isFavorite));
}

function isMidExecuteInventoryRun(run: RunSummary): boolean {
  if (run.hasGoldenManifest === true) {
    return false;
  }

  if (run.hasFindingsSnapshot === true) {
    return false;
  }

  return true;
}

function inventoryRunTier(run: RunSummary, inFlightRunIds: ReadonlySet<string>): number {
  const runId = run.runId?.trim() ?? "";

  if (runId.length > 0 && inFlightRunIds.has(runId)) {
    return 0;
  }

  if (isMidExecuteInventoryRun(run)) {
    return 1;
  }

  return 2;
}

function compareRunsForInventory(
  left: RunSummary,
  right: RunSummary,
  isFavorite: (runId: string) => boolean,
  inFlightRunIds: ReadonlySet<string> = new Set(),
): number {
  const leftTier = inventoryRunTier(left, inFlightRunIds);
  const rightTier = inventoryRunTier(right, inFlightRunIds);

  if (leftTier !== rightTier) {
    return leftTier - rightTier;
  }

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
}

/** Working reviews hub: in-flight / mid-execute packages above completed samples (LI-08). */
export function sortRunsForWorkingReviewsHubInventory(
  runs: readonly RunSummary[],
  isFavorite: (runId: string) => boolean,
  inFlightRunIds: ReadonlySet<string>,
): RunSummary[] {
  return [...runs].sort((left, right) => compareRunsForInventory(left, right, isFavorite, inFlightRunIds));
}

export function reviewsHubInventoryFilterEmptyReason(filter: ReviewFilterId): string {
  const option = INVENTORY_FILTER_OPTIONS.find((entry) => entry.id === filter);

  return `No reviews match ${option?.label ?? filter}.`;
}

export function emptyInventoryDescription(draftCount: number, isWorkingMode = false): string {
  if (isWorkingMode) {
    if (draftCount === 1) {
      return WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY;
    }

    if (draftCount > 1) {
      return WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY;
    }

    return WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY;
  }

  if (draftCount === 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY;
  }

  if (draftCount > 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY;
  }

  return REVIEWS_HUB_RECENT_EMPTY_BODY;
}
