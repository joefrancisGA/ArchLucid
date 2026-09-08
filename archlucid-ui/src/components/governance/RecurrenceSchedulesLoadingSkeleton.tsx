import { RECURRENCE_SCHEDULES_LOADING_STATUS } from "@/lib/recurrence-schedules-page-copy";

/** Loading placeholder while recurrence schedules resolve (GRX). */
export function RecurrenceSchedulesLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="space-y-3"
      data-testid="recurrence-schedules-loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={RECURRENCE_SCHEDULES_LOADING_STATUS}
    >
      <p className="m-0 text-al-text-secondary">{RECURRENCE_SCHEDULES_LOADING_STATUS}</p>
      <div className="h-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
