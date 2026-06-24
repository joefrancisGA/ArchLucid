/** Query param used by governance conflict links to pre-select a pack on `/policy-packs`. */
export const POLICY_PACK_ID_QUERY_PARAM = "packId";

/** Query param used by alert inbox deep links to focus a policy or alert rule on `/policy-packs`. */
export const POLICY_RULE_ID_QUERY_PARAM = "ruleId";

/** Primary section tab on `/policy-packs` (`my-packs`, `catalog`, `generator`, `author`). */
export const POLICY_PACKS_TAB_QUERY_PARAM = "tab";

export function policyPacksGeneratorHref(): string {
  const params = new URLSearchParams();
  params.set(POLICY_PACKS_TAB_QUERY_PARAM, "generator");

  return `/policy-packs?${params.toString()}`;
}

export function policyPacksEditHref(policyPackId: string): string {
  const id = policyPackId.trim();

  if (id.length === 0) {
    return "/policy-packs";
  }

  const params = new URLSearchParams();
  params.set(POLICY_PACK_ID_QUERY_PARAM, id);

  return `/policy-packs?${params.toString()}`;
}

/** Opens the first-class rule authoring tab with optional pack and rule focus. */
export function policyPacksAuthorHref(policyPackId?: string, ruleId?: string): string {
  const params = new URLSearchParams();
  params.set(POLICY_PACKS_TAB_QUERY_PARAM, "author");

  const pack = policyPackId?.trim() ?? "";

  if (pack.length > 0) {
    params.set(POLICY_PACK_ID_QUERY_PARAM, pack);
  }

  const rule = ruleId?.trim() ?? "";

  if (rule.length > 0) {
    params.set(POLICY_RULE_ID_QUERY_PARAM, rule);
  }

  return `/policy-packs?${params.toString()}`;
}

export function policyPacksRuleHref(ruleId: string): string {
  const id = ruleId.trim();

  if (id.length === 0) {
    return "/policy-packs";
  }

  const params = new URLSearchParams();
  params.set(POLICY_RULE_ID_QUERY_PARAM, id);

  return `/policy-packs?${params.toString()}`;
}
