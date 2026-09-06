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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PILOT_ROI_VALIDATION_INTERVIEW_OPEN_PARAM);
  } else {
    params.set(PILOT_ROI_VALIDATION_INTERVIEW_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
