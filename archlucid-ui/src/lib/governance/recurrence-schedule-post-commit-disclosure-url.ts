import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM = "recurrenceSchedulePostCommitOpen";

export function parseRecurrenceSchedulePostCommitOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function recurrenceSchedulePostCommitDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM);
}
