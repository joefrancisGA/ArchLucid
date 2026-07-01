import {
  RECURRENCE_SCHEDULES_HELPER_BODY,
  RECURRENCE_SCHEDULES_HELPER_NEXT_STEP,
  RECURRENCE_SCHEDULES_HELPER_TITLE,
} from "@/lib/recurrence-schedules-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Right-rail guidance for the recurrence schedules governance workspace. */
export function RecurrenceSchedulesWorkflowHelperCard() {
  return (
    <aside
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      aria-label={RECURRENCE_SCHEDULES_HELPER_TITLE}
      data-testid="recurrence-schedules-helper-card"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {RECURRENCE_SCHEDULES_HELPER_TITLE}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {RECURRENCE_SCHEDULES_HELPER_BODY}
      </p>
      <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">Next step: </span>
        {RECURRENCE_SCHEDULES_HELPER_NEXT_STEP}
      </p>
    </aside>
  );
}
