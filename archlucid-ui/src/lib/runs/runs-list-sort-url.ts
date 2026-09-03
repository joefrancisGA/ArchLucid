import type { SortOrder } from "@/app/(operator)/architecture/reviews/runs-list-types";

export const RUNS_LIST_SORT_PARAM = "sort";

export type RunsListSortId = "created-desc" | "created-asc";

const RUNS_LIST_SORT_IDS = new Set<string>(["created-desc", "created-asc"]);

export const DEFAULT_RUNS_LIST_SORT: RunsListSortId = "created-desc";

export function sortOrderFromRunsListSort(sort: RunsListSortId): SortOrder {
  return sort === "created-asc" ? "createdAsc" : "createdDesc";
}

export function runsListSortFromSortOrder(order: SortOrder): RunsListSortId {
  return order === "createdAsc" ? "created-asc" : "created-desc";
}

export function parseRunsListSortFromSearch(raw: string | null | undefined): RunsListSortId {
  if (raw === null || raw === undefined) {
    return DEFAULT_RUNS_LIST_SORT;
  }

  const trimmed = raw.trim();

  if (!RUNS_LIST_SORT_IDS.has(trimmed)) {
    return DEFAULT_RUNS_LIST_SORT;
  }

  return trimmed as RunsListSortId;
}

export function runsListSortHrefFromSearch(
  currentSearch: string,
  sort: RunsListSortId,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sort === DEFAULT_RUNS_LIST_SORT) {
    params.delete(RUNS_LIST_SORT_PARAM);
  } else {
    params.set(RUNS_LIST_SORT_PARAM, sort);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
