import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM = "quickDecisionPolicyPackImpactOpen";

export function parseQuickDecisionPolicyPackImpactOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function quickDecisionPolicyPackImpactDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM);
}
