import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(HELP_ENGINEERING_TROUBLESHOOTING_SEARCH_PARAM);
    } else {
      params.set(HELP_ENGINEERING_TROUBLESHOOTING_SEARCH_PARAM, trimmed);
    }
    },
  });
}

export function helpEngineeringTroubleshootingClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = ENGINEERING_TROUBLESHOOTING_HELP_PATH,
): string {
  return helpEngineeringTroubleshootingSearchHrefFromSearch(currentSearch, "", pathname);
}
