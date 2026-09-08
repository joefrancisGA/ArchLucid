export const COMPARE_STALE_INPUTS_TECHNICAL_IDS_OPEN_PARAM = "compareStaleInputsTechnicalIdsOpen";

export function parseCompareStaleInputsTechnicalIdsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareStaleInputsTechnicalIdsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(COMPARE_STALE_INPUTS_TECHNICAL_IDS_OPEN_PARAM);
  } else {
    params.set(COMPARE_STALE_INPUTS_TECHNICAL_IDS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
