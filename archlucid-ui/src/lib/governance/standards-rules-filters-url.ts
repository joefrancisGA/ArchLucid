import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const STANDARDS_RULES_SEARCH_PARAM = "q";
export const STANDARDS_RULES_SEVERITY_PARAM = "severity";

export function parseStandardsRulesSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseStandardsRulesSeverityFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return "all";
  }

  return trimmed;
}

export function standardsRulesSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(STANDARDS_RULES_SEARCH_PARAM);
  } else {
    params.set(STANDARDS_RULES_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function standardsRulesClearSearchHrefFromSearch(
  currentSearch: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  return standardsRulesSearchHrefFromSearch(currentSearch, "", pathname);
}

export function standardsRulesSeverityHrefFromSearch(
  currentSearch: string,
  severity: string,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = severity.trim();

  if (trimmed.length === 0 || trimmed === "all") {
    params.delete(STANDARDS_RULES_SEVERITY_PARAM);
  } else {
    params.set(STANDARDS_RULES_SEVERITY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
