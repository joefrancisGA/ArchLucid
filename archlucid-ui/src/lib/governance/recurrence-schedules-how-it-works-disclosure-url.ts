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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RECURRENCE_SCHEDULES_HOW_IT_WORKS_OPEN_PARAM);
  } else {
    params.set(RECURRENCE_SCHEDULES_HOW_IT_WORKS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
