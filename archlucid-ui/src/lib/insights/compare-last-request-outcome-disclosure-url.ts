export const COMPARE_LAST_REQUEST_OUTCOME_OPEN_PARAM = "compareLastRequestOutcomeOpen";

export function parseCompareLastRequestOutcomeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareLastRequestOutcomeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(COMPARE_LAST_REQUEST_OUTCOME_OPEN_PARAM);
  } else {
    params.set(COMPARE_LAST_REQUEST_OUTCOME_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
