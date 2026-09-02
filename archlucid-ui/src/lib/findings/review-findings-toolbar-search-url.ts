export const REVIEW_FINDINGS_TOOLBAR_SEARCH_PARAM = "q";

export function parseReviewFindingsToolbarSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function reviewFindingsToolbarSearchHrefFromSearch(
  currentSearch: string,
  pathname: string,
  query: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(REVIEW_FINDINGS_TOOLBAR_SEARCH_PARAM);
  } else {
    params.set(REVIEW_FINDINGS_TOOLBAR_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function reviewFindingsToolbarClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string,
): string {
  return reviewFindingsToolbarSearchHrefFromSearch(currentSearch, pathname, "");
}
