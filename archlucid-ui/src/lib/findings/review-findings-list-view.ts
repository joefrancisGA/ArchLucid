/** Review-detail findings presentation: dense table (default Working) or card stack. */
export type ReviewFindingsListViewKind = "table" | "cards";

export const REVIEW_FINDINGS_LIST_VIEW_PARAM = "findingsListView";

const LIST_VIEW_ALLOWLIST: ReadonlySet<string> = new Set(["table", "cards"]);

export function parseReviewFindingsListViewFromSearch(
  raw: string | null | undefined,
): ReviewFindingsListViewKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!LIST_VIEW_ALLOWLIST.has(trimmed)) {
    return null;
  }

  return trimmed as ReviewFindingsListViewKind;
}

export function reviewFindingsListViewHrefFromSearch(
  currentSearch: string,
  view: ReviewFindingsListViewKind,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  params.set(REVIEW_FINDINGS_LIST_VIEW_PARAM, view);
  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export function defaultReviewFindingsListView(workingMode: boolean): ReviewFindingsListViewKind {
  return workingMode ? "table" : "cards";
}
