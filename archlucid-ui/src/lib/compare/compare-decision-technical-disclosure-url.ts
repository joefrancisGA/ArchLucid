export const COMPARE_DECISION_TECHNICAL_KEY_PARAM = "compareDecisionTechnicalKey";

export function parseCompareDecisionTechnicalKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function compareDecisionTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  decisionKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (decisionKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(COMPARE_DECISION_TECHNICAL_KEY_PARAM);
  } else {
    params.set(COMPARE_DECISION_TECHNICAL_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
