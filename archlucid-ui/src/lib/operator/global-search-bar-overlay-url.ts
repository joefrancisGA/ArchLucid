import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, GLOBAL_SEARCH_BAR_OPEN_PARAM);
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
