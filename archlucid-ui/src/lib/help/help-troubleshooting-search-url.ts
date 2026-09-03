import { TROUBLESHOOTING_HELP_CANONICAL_PATH } from "@/lib/troubleshooting-help-evidence-copy";

export const HELP_TROUBLESHOOTING_SEARCH_PARAM = "q";

export function parseHelpTroubleshootingSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpTroubleshootingSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = TROUBLESHOOTING_HELP_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(HELP_TROUBLESHOOTING_SEARCH_PARAM);
  } else {
    params.set(HELP_TROUBLESHOOTING_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function helpTroubleshootingClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = TROUBLESHOOTING_HELP_CANONICAL_PATH,
): string {
  return helpTroubleshootingSearchHrefFromSearch(currentSearch, "", pathname);
}
