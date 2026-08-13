"use client";

import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildRecurrenceLocalTimeSummary,
  resolveRecurrenceDisplayTimeZoneId,
} from "@/lib/recurrence-local-time";
import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_EXAMPLES_HEADING,
  type RecurrenceScheduleExample,
} from "@/lib/recurrence-schedules-copy";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleExamplesSectionProps = {
  readonly onApplyExample?: (example: RecurrenceScheduleExample) => void;
  readonly disabled?: boolean;
  /** TB-1133 - compact chooser under Create (not a fourth card column). */
  readonly variant?: "cards" | "compact";
};

/**
 * The visible cadence block is `aria-hidden` inside the button so the accessible name is not the
 * cadence repeated three times. That means this label is the *only* route by which assistive tech
 * learns which cadence it is choosing, so it must carry the authored cadence and its rationale —
 * naming the title and the effect alone would hide the actual governance decision.
 */
function buildExampleApplyAriaLabel(example: RecurrenceScheduleExample): string {
  return `Use the ${example.title} cadence — ${example.humanCadence}. ${example.whenToUse} Opens the create recurrence schedule form with this cadence filled in.`;
}

function ExampleCadenceBody(props: {
  readonly example: RecurrenceScheduleExample;
  readonly isCompact: boolean;
  readonly timeZoneId: string;
  readonly hideFromAccessibleName?: boolean;
}) {
  const { example, isCompact, timeZoneId, hideFromAccessibleName = false } = props;
  const summary = useMemo(
    () =>
      buildRecurrenceLocalTimeSummary({
        cronExpression: example.cronExpression,
        ianaTimeZoneId: timeZoneId,
        referenceUtc: "2026-07-20T12:00:00.000Z",
      }),
    [example.cronExpression, timeZoneId],
  );
  const content = (
    <>
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {example.title}
      </p>
      <div
        className={cn(isCompact ? "mt-0.5" : "mt-1")}
        data-testid="recurrence-schedule-example-human-cadence"
      >
        <RecurrenceLocalTimeDisplay summary={summary} authoredUtcCadence={example.humanCadence} />
      </div>
      {isCompact ? (
        <>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {example.whenToUse}
          </p>
          <span className="sr-only" data-testid="recurrence-schedule-example-cron">
            Cron (UTC): {example.cronExpression}
          </span>
        </>
      ) : (
        <>
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
      )}
    </>
  );

  if (hideFromAccessibleName) {
    return <span aria-hidden="true">{content}</span>;
  }

  return content;
}

/** Static examples that explain when to use common recurrence cadences (TB-1132 / TB-1133). */
export function RecurrenceScheduleExamplesSection(props: RecurrenceScheduleExamplesSectionProps) {
  const { onApplyExample, disabled = false, variant = "cards" } = props;
  const isInteractive = onApplyExample !== undefined && !disabled;
  const isCompact = variant === "compact";
  const heading = isCompact ? "Start from a common cadence" : RECURRENCE_SCHEDULES_EXAMPLES_HEADING;
  const timeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);

  return (
    <section
      aria-label={heading}
      className={cn(
        "rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
        isCompact ? "p-3" : "p-4",
      )}
      data-testid="recurrence-schedule-examples"
      data-variant={variant}
    >
      <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {heading}
      </h3>
      <ul
        className={cn(
          "m-0 list-none p-0",
          OPERATOR_TYPOGRAPHY.body,
          isCompact ? "mt-2 divide-y divide-neutral-200 dark:divide-neutral-700" : "mt-3 space-y-3",
        )}
      >
        {RECURRENCE_SCHEDULE_EXAMPLES.map((example) => {
          const body = (
            <ExampleCadenceBody
              example={example}
              isCompact={isCompact}
              timeZoneId={timeZoneId}
              hideFromAccessibleName={isInteractive && isCompact}
            />
          );

          const itemClassName = isCompact
            ? "sidebar-disclosure-trigger group flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-teal-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-teal-400 dark:hover:bg-neutral-900"
            : "sidebar-disclosure-trigger w-full rounded-md border border-neutral-200 px-3 py-2 text-left transition-colors hover:border-teal-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:border-teal-400 dark:hover:bg-neutral-900";

          return (
            <li key={example.title}>
              {isInteractive ? (
                <button
                  type="button"
                  disabled={disabled}
                  className={itemClassName}
                  aria-label={isCompact ? buildExampleApplyAriaLabel(example) : undefined}
                  data-testid={`recurrence-schedule-example-${example.cronExpression}`}
                  onClick={() => onApplyExample(example)}
                >
                  {isCompact ? (
                    <>
                      <span className="min-w-0 flex-1">{body}</span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-teal-700 dark:text-teal-400",
                          OPERATOR_TYPOGRAPHY.helper,
                        )}
                        aria-hidden="true"
                      >
                        Use this cadence
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </span>
                    </>
                  ) : (
                    body
                  )}
                </button>
              ) : (
                <div
                  className={
                    isCompact
                      ? "px-1 py-2"
                      : "rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                  }
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
