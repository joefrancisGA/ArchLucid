export const POLICY_RULE_AUTHORING_RAW_JSON_OPEN_PARAM = "policyRuleAuthoringRawJsonOpen";

export function parsePolicyRuleAuthoringRawJsonOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function policyRuleAuthoringRawJsonDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(POLICY_RULE_AUTHORING_RAW_JSON_OPEN_PARAM);
  } else {
    params.set(POLICY_RULE_AUTHORING_RAW_JSON_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
