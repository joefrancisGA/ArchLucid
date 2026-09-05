export const QUICK_DECISION_MUTE_FINDING_ID_PARAM = "muteFindingId";

export function parseQuickDecisionMuteFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function quickDecisionMutePanelsHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(QUICK_DECISION_MUTE_FINDING_ID_PARAM);
  } else {
    params.set(QUICK_DECISION_MUTE_FINDING_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
