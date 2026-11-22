import { buildOperatorHrefFromSearch, operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM = "recurrenceSchedulePostCommitOpen";

export function parseRecurrenceSchedulePostCommitOpenFromSearch(
  raw: string | null | undefined,
  defaultOpen = false,
): boolean {
  const trimmed = raw?.trim().toLowerCase();
  if (trimmed === "1" || trimmed === "true") return true;
  if (trimmed === "0" || trimmed === "false") return false;
  return defaultOpen;
}

export function recurrenceSchedulePostCommitDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
  defaultOpen = false,
): string {
  if (!open && defaultOpen) {
    return buildOperatorHrefFromSearch(currentSearch, pathname, {
      selectionSwitch: { kind: "disclosure-only" },
      mutate: (params) => params.set(RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM, "0"),
    });
  }

  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM);
}
