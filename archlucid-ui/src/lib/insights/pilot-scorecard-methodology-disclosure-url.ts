export const PILOT_SCORECARD_METHODOLOGY_OPEN_PARAM = "pilotScorecardMethodologyOpen";

export function parsePilotScorecardMethodologyOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pilotScorecardMethodologyDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PILOT_SCORECARD_METHODOLOGY_OPEN_PARAM);
  } else {
    params.set(PILOT_SCORECARD_METHODOLOGY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
