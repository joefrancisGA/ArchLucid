import type { RunDetailFindingsSortKind } from "@/components/findings/run-detail-findings-toolbar-presentation";

export const REVIEW_FINDINGS_TOOLBAR_SORT_PARAM = "findingsSort";

const SORT_IDS = new Set<string>(["trust-then-severity", "severity-desc", "severity-asc", "title-asc"]);

export const DEFAULT_REVIEW_FINDINGS_TOOLBAR_SORT: RunDetailFindingsSortKind = "trust-then-severity";

export function parseReviewFindingsToolbarSortFromSearch(
  raw: string | null | undefined,
): RunDetailFindingsSortKind {
  if (raw === null || raw === undefined) {
    return DEFAULT_REVIEW_FINDINGS_TOOLBAR_SORT;
  }

  const trimmed = raw.trim();

  if (!SORT_IDS.has(trimmed)) {
    return DEFAULT_REVIEW_FINDINGS_TOOLBAR_SORT;
  }

  return trimmed as RunDetailFindingsSortKind;
}

export function reviewFindingsToolbarSortHrefFromSearch(
  currentSearch: string,
  pathname: string,
  sort: RunDetailFindingsSortKind,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sort === DEFAULT_REVIEW_FINDINGS_TOOLBAR_SORT) {
    params.delete(REVIEW_FINDINGS_TOOLBAR_SORT_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_TOOLBAR_SORT_PARAM, sort);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
