export const RUNS_LIST_SEARCH_PARAM = "q";

export function parseRunsListSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function runsListSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(RUNS_LIST_SEARCH_PARAM);
  } else {
    params.set(RUNS_LIST_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function runsListClearSearchHrefFromSearch(currentSearch: string, pathname: string): string {
  return runsListSearchHrefFromSearch(currentSearch, "", pathname);
}

/** Merge in-progress filter text into URL search params for navigation hrefs before debounced q= sync. */
export function runsListEffectiveSearchFromSearch(currentSearch: string, pendingQuery: string): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = pendingQuery.trim();

  if (trimmed.length === 0) {
    params.delete(RUNS_LIST_SEARCH_PARAM);
  } else {
    params.set(RUNS_LIST_SEARCH_PARAM, trimmed);
  }

  return params.toString();
}
