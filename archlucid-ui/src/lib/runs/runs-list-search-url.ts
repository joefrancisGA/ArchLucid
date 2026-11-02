import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(RUNS_LIST_SEARCH_PARAM);
    } else {
      params.set(RUNS_LIST_SEARCH_PARAM, trimmed);
    }
    },
  });
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

const NAVIGATION_COMMITTED_OVERLAY_PARAMS = ["compareRuns", "inspectorRunId"] as const;

/**
 * Pagination and filter-chip hrefs merge pending `q=` from the router snapshot, then overlay
 * compare/inspector params from committed window.location when App Router searchParams lag.
 */
export function runsListNavigationSearchFromSearch(
  routerSearch: string,
  committedSearch: string,
  pendingQuery: string,
): string {
  const merged = new URLSearchParams(runsListEffectiveSearchFromSearch(routerSearch, pendingQuery));
  const committed = new URLSearchParams(committedSearch);
  const router = new URLSearchParams(routerSearch);

  for (const key of NAVIGATION_COMMITTED_OVERLAY_PARAMS) {
    const committedValue = committed.get(key);
    const routerValue = router.get(key);

    if (committedValue === routerValue) {
      continue;
    }

    if (committedValue === null) {
      merged.delete(key);
    } else {
      merged.set(key, committedValue);
    }
  }

  return merged.toString();
}
