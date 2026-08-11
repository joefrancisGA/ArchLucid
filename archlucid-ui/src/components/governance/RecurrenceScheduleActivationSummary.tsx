"use client";

import { useEffect, useMemo, useState } from "react";

import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import { previewRecurrenceScheduleRuns } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildRecurrenceLocalTimeSummary,
  formatRecurrenceInstantLocalFirst,
  resolveRecurrenceDisplayTimeZoneId,
} from "@/lib/recurrence-local-time";
import {
  RECURRENCE_ACTIVATION_SUMMARY_HEADING,
  RECURRENCE_EACH_OCCURRENCE_NOTE,
} from "@/lib/recurrence-schedule-activation-copy";
import { cn } from "@/lib/utils";

export type RecurrenceScheduleActivationSummaryProps = {
  readonly cronExpression: string;
  readonly isActive: boolean;
};

/** Cadence, next run, and activation status shown before saving or enabling a recurrence schedule. */
export function RecurrenceScheduleActivationSummary(props: RecurrenceScheduleActivationSummaryProps) {
  const { cronExpression, isActive } = props;
  const [nextRunUtc, setNextRunUtc] = useState<string | null>(null);
  const trimmedCron = cronExpression.trim();
  const displayTimeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);
  const cadenceSummary = useMemo(
    () =>
      buildRecurrenceLocalTimeSummary({
        cronExpression: trimmedCron,
        nextRunUtc,
        ianaTimeZoneId: displayTimeZoneId,
      }),
    [trimmedCron, nextRunUtc, displayTimeZoneId],
  );
  const nextRunSummary = useMemo(
    () => formatRecurrenceInstantLocalFirst(nextRunUtc, displayTimeZoneId),
    [nextRunUtc, displayTimeZoneId],
  );

  useEffect(() => {
    let cancelled = false;

    if (trimmedCron.length === 0) {
      setNextRunUtc(null);

      return () => {
        cancelled = true;
      };
    }

    void previewRecurrenceScheduleRuns({ cronExpression: trimmedCron, count: 1 })
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.isValid && result.nextRunUtc.length > 0) {
          setNextRunUtc(result.nextRunUtc[0] ?? null);
        } else {
          setNextRunUtc(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNextRunUtc(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trimmedCron]);

  return (
    <section
      aria-label={RECURRENCE_ACTIVATION_SUMMARY_HEADING}
      className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="recurrence-activation-summary"
    >
      <h4 className={cn("m-0 mb-2 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.label)}>
        {RECURRENCE_ACTIVATION_SUMMARY_HEADING}
      </h4>
      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Schedule cadence</dt>
          <dd className="m-0">
            <RecurrenceLocalTimeDisplay
              summary={cadenceSummary}
              primaryTestId="recurrence-activation-cadence-local"
              secondaryTestId="recurrence-activation-cadence-utc"
            />
          </dd>
        </div>
        <div>
          <dt className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Next expected run</dt>
          <dd className="m-0" data-testid="recurrence-activation-next-run">
            <RecurrenceLocalTimeDisplay
              summary={nextRunSummary}
              primaryTestId="recurrence-activation-next-run-local"
              secondaryTestId="recurrence-activation-next-run-utc"
            />
          </dd>
        </div>
        <div>
          <dt className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Schedule status</dt>
          <dd className="m-0" data-testid="recurrence-activation-status">
            {isActive ? "Active" : "Paused / inactive"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Assessment runs</dt>
          <dd className="m-0">{RECURRENCE_EACH_OCCURRENCE_NOTE}</dd>
        </div>
      </dl>
    </section>
  );
}
