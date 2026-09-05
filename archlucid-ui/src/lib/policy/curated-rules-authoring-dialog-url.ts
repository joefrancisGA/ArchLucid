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
  const params = new URLSearchParams(currentSearch);
  const trimmed = (ruleId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(CURATED_RULE_EDIT_PARAM);
  } else {
    params.set(CURATED_RULE_EDIT_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
