import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RECURRENCE_SCHEDULES_WORKFLOW_OPEN_PARAM = "recurrenceSchedulesWorkflowOpen";

export function parseRecurrenceSchedulesWorkflowOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function recurrenceSchedulesWorkflowDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RECURRENCE_SCHEDULES_WORKFLOW_OPEN_PARAM);
}
