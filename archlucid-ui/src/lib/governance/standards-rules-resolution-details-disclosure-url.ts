import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const STANDARDS_RULES_RESOLUTION_DETAILS_OPEN_PARAM = "standardsRulesResolutionDetailsOpen";

export function parseStandardsRulesResolutionDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function standardsRulesResolutionDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, STANDARDS_RULES_RESOLUTION_DETAILS_OPEN_PARAM);
}
