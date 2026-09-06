export const ADMIN_HEALTH_LINT_RULE_ID_PARAM = "adminHealthLintRuleId";

export function parseAdminHealthLintRuleIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function adminHealthLintRuleDisclosureHrefFromSearch(
  currentSearch: string,
  ruleId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (ruleId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ADMIN_HEALTH_LINT_RULE_ID_PARAM);
  } else {
    params.set(ADMIN_HEALTH_LINT_RULE_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
