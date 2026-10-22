import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RECURRENCE_SCHEDULES_HOW_IT_WORKS_OPEN_PARAM = "recurrenceSchedulesHowItWorksOpen";

export function parseRecurrenceSchedulesHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function recurrenceSchedulesHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RECURRENCE_SCHEDULES_HOW_IT_WORKS_OPEN_PARAM);
}
