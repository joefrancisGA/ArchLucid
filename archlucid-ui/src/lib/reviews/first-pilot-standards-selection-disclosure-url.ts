import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FIRST_PILOT_STANDARDS_SELECTION_OPEN_PARAM = "firstPilotStandardsSelectionOpen";

export function parseFirstPilotStandardsSelectionOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstPilotStandardsSelectionDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FIRST_PILOT_STANDARDS_SELECTION_OPEN_PARAM);
}
