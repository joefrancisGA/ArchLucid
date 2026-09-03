export const HELP_HUB_PATH = "/help";
export const HELP_HUB_SEARCH_PARAM = "q";

export function parseHelpHubSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpHubSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = HELP_HUB_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(HELP_HUB_SEARCH_PARAM);
  } else {
    params.set(HELP_HUB_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function helpHubClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = HELP_HUB_PATH,
): string {
  return helpHubSearchHrefFromSearch(currentSearch, "", pathname);
}
