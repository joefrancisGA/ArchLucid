"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL,
  ADVISORY_SCANS_SCHEDULES_TIMING_NOTE,
} from "@/lib/advisory-copy";
import type { AdvisorySchedulePreviewState } from "@/lib/advisory-schedule-upcoming-preview";

export type AdvisoryScheduleCreatePreviewProps = {
  readonly preview: AdvisorySchedulePreviewState;
};

export function AdvisoryScheduleCreatePreview({ preview }: AdvisoryScheduleCreatePreviewProps) {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="advisory-schedule-upcoming-preview"
    >
      <p
        className={cn(
          "m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {ADVISORY_SCANS_SCHEDULES_TIMING_NOTE}
      </p>
      {preview.loading ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
          aria-live="polite"
        >
          Updating preview…
        </p>
      ) : null}
      {preview.validationError !== null ? (
        <p className={cn("m-0 mt-2 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {preview.validationError}
        </p>
      ) : null}
      {preview.runs.length > 0 ? (
        <ol
          className={cn(
            "m-0 mt-2 list-decimal space-y-2 pl-5 text-neutral-800 dark:text-neutral-200",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {preview.runs.map((occurrence) => (
            <li key={occurrence.iso}>
              <dl className="m-0 grid gap-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-3">
                <div>
                  <dt className="sr-only">Local time</dt>
                  <dd className="m-0">{occurrence.primary}</dd>
                </div>
                <div>
                  <dt className="sr-only">UTC</dt>
                  <dd className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    ({occurrence.utcSecondary})
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
