import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PILOT_SCORECARD_METHODOLOGY_OPEN_PARAM);
}
