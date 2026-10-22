import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AI_USAGE_COST_SCOPE_HELP_OPEN_PARAM = "aiUsageCostScopeHelpOpen";

export function parseAiUsageCostScopeHelpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function aiUsageCostScopeHelpDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AI_USAGE_COST_SCOPE_HELP_OPEN_PARAM);
}
