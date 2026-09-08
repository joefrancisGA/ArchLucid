export const POLICY_PACKS_BUNDLED_RULE_KEYS_OPEN_PARAM = "policyPacksBundledRuleKeysOpen";

export function parsePolicyPacksBundledRuleKeysOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyPacksBundledRuleKeysDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(POLICY_PACKS_BUNDLED_RULE_KEYS_OPEN_PARAM);
  } else {
    params.set(POLICY_PACKS_BUNDLED_RULE_KEYS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
