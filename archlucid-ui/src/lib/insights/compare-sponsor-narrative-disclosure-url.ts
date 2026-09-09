export const COMPARE_SPONSOR_NARRATIVE_OPEN_PARAM = "compareSponsorNarrativeOpen";

export function parseCompareSponsorNarrativeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compareSponsorNarrativeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(COMPARE_SPONSOR_NARRATIVE_OPEN_PARAM);
  } else {
    params.set(COMPARE_SPONSOR_NARRATIVE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
