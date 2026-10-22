import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PILOT_ROI_VALIDATION_INTERVIEW_OPEN_PARAM = "pilotRoiValidationInterviewOpen";

export function parsePilotRoiValidationInterviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pilotRoiValidationInterviewDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PILOT_ROI_VALIDATION_INTERVIEW_OPEN_PARAM);
}
