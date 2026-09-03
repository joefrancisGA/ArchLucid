import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const STANDARDS_RULES_SORT_PARAM = "sort";
export const STANDARDS_RULES_SORT_DIR_PARAM = "dir";

export type StandardsRulesSortKey = "ruleName" | "standardFramework" | "severity" | "enforcementMode";

const SORT_KEY_IDS = new Set<string>(["ruleName", "standardFramework", "severity", "enforcementMode"]);
const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export const DEFAULT_STANDARDS_RULES_SORT_KEY: StandardsRulesSortKey = "ruleName";
export const DEFAULT_STANDARDS_RULES_SORT_ASC = true;

export function parseStandardsRulesSortKeyFromSearch(raw: string | null | undefined): StandardsRulesSortKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_STANDARDS_RULES_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return DEFAULT_STANDARDS_RULES_SORT_KEY;
  }

  return trimmed as StandardsRulesSortKey;
}

export function parseStandardsRulesSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return DEFAULT_STANDARDS_RULES_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return DEFAULT_STANDARDS_RULES_SORT_ASC;
  }

  return trimmed === "asc";
}

export function standardsRulesSortHrefFromSearch(
  currentSearch: string,
  sortKey: StandardsRulesSortKey,
  sortAsc: boolean,
  pathname: string = GOVERNANCE_STANDARDS_AND_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sortKey === DEFAULT_STANDARDS_RULES_SORT_KEY) {
    params.delete(STANDARDS_RULES_SORT_PARAM);
  } else {
    params.set(STANDARDS_RULES_SORT_PARAM, sortKey);
  }

  if (sortAsc === DEFAULT_STANDARDS_RULES_SORT_ASC) {
    params.delete(STANDARDS_RULES_SORT_DIR_PARAM);
  } else {
    params.set(STANDARDS_RULES_SORT_DIR_PARAM, sortAsc ? "asc" : "desc");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
