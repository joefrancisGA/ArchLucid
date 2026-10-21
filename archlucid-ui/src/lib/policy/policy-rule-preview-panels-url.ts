import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const POLICY_RULE_PREVIEW_ID_PARAM = "rulePreviewId";

export function parsePolicyRulePreviewIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function policyRulePreviewPanelsHrefFromSearch(
  currentSearch: string,
  ruleId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (ruleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(POLICY_RULE_PREVIEW_ID_PARAM);
    } else {
      params.set(POLICY_RULE_PREVIEW_ID_PARAM, trimmed);
    }
    },
  });
}
