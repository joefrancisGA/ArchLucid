export const RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM = "runDetailSponsorBriefingOpen";

export function parseRunDetailSponsorBriefingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runDetailSponsorBriefingDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM);
  } else {
    params.set(RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
