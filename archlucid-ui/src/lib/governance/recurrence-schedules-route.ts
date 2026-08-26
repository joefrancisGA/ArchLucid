/** Canonical recurrence schedules workspace path. */
export const GOVERNANCE_RECURRENCE_SCHEDULES_PATH = "/governance/recurrence-schedules" as const;

export function recurrenceSchedulesHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return GOVERNANCE_RECURRENCE_SCHEDULES_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${GOVERNANCE_RECURRENCE_SCHEDULES_PATH}?${qs}` : GOVERNANCE_RECURRENCE_SCHEDULES_PATH;
}

export function recurrenceSchedulesNextReviewHref(runId: string): string {
  return recurrenceSchedulesHref({ runId: runId.trim() });
}
