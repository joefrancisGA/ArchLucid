export const HELP_SEARCH_START_HERE_OPEN_PARAM = "helpSearchStartHereOpen";

export function parseHelpSearchStartHereOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpSearchStartHereDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_SEARCH_START_HERE_OPEN_PARAM);
  } else {
    params.set(HELP_SEARCH_START_HERE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
