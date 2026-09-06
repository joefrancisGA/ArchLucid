export const PILOT_OUTCOMES_TECHNICAL_DETAILS_OPEN_PARAM = "pilotOutcomesTechnicalDetailsOpen";

export function parsePilotOutcomesTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pilotOutcomesTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PILOT_OUTCOMES_TECHNICAL_DETAILS_OPEN_PARAM);
  } else {
    params.set(PILOT_OUTCOMES_TECHNICAL_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
