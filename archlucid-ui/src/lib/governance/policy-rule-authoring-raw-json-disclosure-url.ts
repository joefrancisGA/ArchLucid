import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, POLICY_RULE_AUTHORING_RAW_JSON_OPEN_PARAM);
}
