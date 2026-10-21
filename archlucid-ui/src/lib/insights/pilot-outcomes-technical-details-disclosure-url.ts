import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PILOT_OUTCOMES_TECHNICAL_DETAILS_OPEN_PARAM);
}
