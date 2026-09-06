export const DRAFT_INTAKE_REASON_FOLLOW_UP_OPEN_PARAM = "draftIntakeReasonFollowUpOpen";

export function parseDraftIntakeReasonFollowUpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function draftIntakeReasonFollowUpDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(DRAFT_INTAKE_REASON_FOLLOW_UP_OPEN_PARAM);
  } else {
    params.set(DRAFT_INTAKE_REASON_FOLLOW_UP_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
