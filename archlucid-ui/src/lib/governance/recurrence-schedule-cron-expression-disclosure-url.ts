import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RECURRENCE_SCHEDULE_CRON_EXPRESSION_SCHEDULE_ID_PARAM = "recurrenceScheduleCronExpressionScheduleId";

export function parseRecurrenceScheduleCronExpressionScheduleIdFromSearch(
  raw: string | null | undefined,
): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function recurrenceScheduleCronExpressionDisclosureHrefFromSearch(
  currentSearch: string,
  scheduleId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (scheduleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(RECURRENCE_SCHEDULE_CRON_EXPRESSION_SCHEDULE_ID_PARAM);
    } else {
      params.set(RECURRENCE_SCHEDULE_CRON_EXPRESSION_SCHEDULE_ID_PARAM, trimmed);
    }
    },
  });
}
