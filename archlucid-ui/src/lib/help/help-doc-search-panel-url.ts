export const HELP_DOC_SEARCH_OPEN_PARAM = "helpSearchOpen";
export const HELP_DOC_SEARCH_QUERY_PARAM = "helpSearchQ";

export type HelpDocSearchPanelUrlState = {
  readonly open: boolean;
  readonly query: string;
};

export function parseHelpDocSearchOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseHelpDocSearchQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpDocSearchPanelHrefFromSearch(
  currentSearch: string,
  state: HelpDocSearchPanelUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const query = state.query.trim();

  if (!state.open) {
    params.delete(HELP_DOC_SEARCH_OPEN_PARAM);
    params.delete(HELP_DOC_SEARCH_QUERY_PARAM);
  } else {
    params.set(HELP_DOC_SEARCH_OPEN_PARAM, "1");

    if (query.length === 0) {
      params.delete(HELP_DOC_SEARCH_QUERY_PARAM);
    } else {
      params.set(HELP_DOC_SEARCH_QUERY_PARAM, query);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
