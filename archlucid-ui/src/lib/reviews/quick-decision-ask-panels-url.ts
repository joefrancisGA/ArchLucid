export const QUICK_DECISION_ASK_FINDING_ID_PARAM = "qdAskFindingId";

export function parseQuickDecisionAskFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function quickDecisionAskPanelsHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(QUICK_DECISION_ASK_FINDING_ID_PARAM);
  } else {
    params.set(QUICK_DECISION_ASK_FINDING_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
