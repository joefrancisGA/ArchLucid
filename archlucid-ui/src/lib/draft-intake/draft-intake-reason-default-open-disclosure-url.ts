import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const DRAFT_INTAKE_REASON_DEFAULT_OPEN_PARAM = "draftIntakeReasonDefaultOpen";

export function parseDraftIntakeReasonDefaultOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function draftIntakeReasonDefaultOpenDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DRAFT_INTAKE_REASON_DEFAULT_OPEN_PARAM);
}
