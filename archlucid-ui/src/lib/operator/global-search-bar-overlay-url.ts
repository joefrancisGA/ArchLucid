export const GLOBAL_SEARCH_BAR_OPEN_PARAM = "globalSearchOpen";

export function parseGlobalSearchBarOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function globalSearchBarOverlayHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GLOBAL_SEARCH_BAR_OPEN_PARAM);
  } else {
    params.set(GLOBAL_SEARCH_BAR_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function currentPathnameWithSearch(pathname: string, currentSearch: string): string {
  return currentSearch.length === 0 ? pathname : `${pathname}?${currentSearch}`;
}

export function isGlobalSearchBarOverlayHrefCurrent(
  currentSearch: string,
  open: boolean,
  pathname: string,
): boolean {
  return (
    globalSearchBarOverlayHrefFromSearch(currentSearch, open, pathname) ===
    currentPathnameWithSearch(pathname, currentSearch)
  );
}
