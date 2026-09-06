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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM);
  } else {
    params.set(QUICK_DECISION_POLICY_PACK_IMPACT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
