import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_EXAMPLES_HEADING,
} from "@/lib/recurrence-schedules-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Static examples that explain when to use common recurrence cadences. */
export function RecurrenceScheduleExamplesSection() {
  return (
    <section
      aria-label={RECURRENCE_SCHEDULES_EXAMPLES_HEADING}
      className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="recurrence-schedule-examples"
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {RECURRENCE_SCHEDULES_EXAMPLES_HEADING}
      </h3>
      <ul className={cn("m-0 mt-3 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {RECURRENCE_SCHEDULE_EXAMPLES.map((example) => (
          <li
            key={example.title}
            className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
          >
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {example.title}
            </p>
            <p className={cn("m-0 mt-1 font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {example.cadence} (UTC)
            </p>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {example.whenToUse}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
