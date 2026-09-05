export const QUICK_DECISION_SHOW_MUTED_PARAM = "showMuted";

export function parseQuickDecisionShowMutedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function quickDecisionMutedFilterHrefFromSearch(
  currentSearch: string,
  showMuted: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!showMuted) {
    params.delete(QUICK_DECISION_SHOW_MUTED_PARAM);
  } else {
    params.set(QUICK_DECISION_SHOW_MUTED_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
