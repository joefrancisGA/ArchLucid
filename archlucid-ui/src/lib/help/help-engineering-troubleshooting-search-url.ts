import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";

export const HELP_ENGINEERING_TROUBLESHOOTING_SEARCH_PARAM = "q";

export function parseHelpEngineeringTroubleshootingSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function helpEngineeringTroubleshootingSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = ENGINEERING_TROUBLESHOOTING_HELP_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(HELP_ENGINEERING_TROUBLESHOOTING_SEARCH_PARAM);
  } else {
    params.set(HELP_ENGINEERING_TROUBLESHOOTING_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function helpEngineeringTroubleshootingClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = ENGINEERING_TROUBLESHOOTING_HELP_PATH,
): string {
  return helpEngineeringTroubleshootingSearchHrefFromSearch(currentSearch, "", pathname);
}
