import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADVISORY_SCHEDULE_ADVANCED_OPEN_PARAM = "advisoryScheduleAdvancedOpen";

export function parseAdvisoryScheduleAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScheduleAdvancedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADVISORY_SCHEDULE_ADVANCED_OPEN_PARAM);
}
