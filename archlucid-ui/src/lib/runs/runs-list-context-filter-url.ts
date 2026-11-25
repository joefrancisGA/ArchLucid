import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const RUNS_LIST_CONTEXT_FILTER_PARAM = "filter";

export function parseRunsListContextFilterFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

export function runsListContextFilterHrefFromSearch(
  currentSearch: string,
  filter: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
      if (filter === null || filter.trim().length === 0) {
        params.delete(RUNS_LIST_CONTEXT_FILTER_PARAM);
      } else {
        params.set(RUNS_LIST_CONTEXT_FILTER_PARAM, filter.trim());
      }
    },
  });
}