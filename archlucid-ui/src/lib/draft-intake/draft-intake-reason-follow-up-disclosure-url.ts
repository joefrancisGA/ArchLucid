import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DRAFT_INTAKE_REASON_FOLLOW_UP_OPEN_PARAM);
}
