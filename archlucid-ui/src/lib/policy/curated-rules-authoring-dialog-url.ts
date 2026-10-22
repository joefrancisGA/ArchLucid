import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const CURATED_RULE_EDIT_PARAM = "curatedRuleEdit";

export function parseCuratedRuleEditIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function curatedRulesAuthoringDialogHrefFromSearch(
  currentSearch: string,
  ruleId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (ruleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(CURATED_RULE_EDIT_PARAM);
    } else {
      params.set(CURATED_RULE_EDIT_PARAM, trimmed);
    }
    },
  });
}
