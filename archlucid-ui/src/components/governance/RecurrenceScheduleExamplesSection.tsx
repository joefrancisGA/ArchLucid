"use client";

import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_EXAMPLES_HEADING,
  type RecurrenceScheduleExample,
} from "@/lib/recurrence-schedules-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleExamplesSectionProps = {
  readonly onApplyExample?: (example: RecurrenceScheduleExample) => void;
  readonly disabled?: boolean;
};

/** Static examples that explain when to use common recurrence cadences (TB-1132). */
export function RecurrenceScheduleExamplesSection(props: RecurrenceScheduleExamplesSectionProps) {
  const { onApplyExample, disabled = false } = props;
  const isInteractive = onApplyExample !== undefined && !disabled;

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
        {RECURRENCE_SCHEDULE_EXAMPLES.map((example) => {
          const body = (
            <>
              <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                {example.title}
              </p>
              <p
                className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
                data-testid="recurrence-schedule-example-human-cadence"
              >
                {example.humanCadence}
              </p>
              <p
                className={cn(
                  "m-0 mt-1 font-mono text-neutral-500 dark:text-neutral-500",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                data-testid="recurrence-schedule-example-cron"
              >
                Cron (UTC): {example.cronExpression}
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {example.whenToUse}
              </p>
            </>
          );

          return (
            <li key={example.title}>
              {isInteractive ? (
                <button
                  type="button"
                  disabled={disabled}
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-left transition-colors hover:border-teal-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:border-teal-400 dark:hover:bg-neutral-900"
                  data-testid={`recurrence-schedule-example-${example.cronExpression}`}
                  onClick={() => onApplyExample(example)}
                >
                  {body}
                </button>
              ) : (
                <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
