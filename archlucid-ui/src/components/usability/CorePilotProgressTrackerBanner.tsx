"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import {
  FIRST_VALUE_MINUTES_ESTIMATE,
  readCorePilotProgressSnapshot,
  subscribeCorePilotChecklist,
} from "@/lib/usability/core-pilot-progress-tracker";
import { getCorePilotChecklistStorageSnapshot } from "@/lib/core-pilot-checklist-storage";
import { cn } from "@/lib/utils";

type CorePilotProgressTrackerBannerProps = {
  readonly className?: string;
  readonly compact?: boolean;
};

function getServerSnapshot(): string {
  return "";
}

/**
 * Cross-page "5 steps to first proof" tracker with time-to-value estimate.
 * Reads the same localStorage keys as {@link CorePilotChecklist}.
 */
export function CorePilotProgressTrackerBanner(props: CorePilotProgressTrackerBannerProps) {
  const snapshot = useSyncExternalStore(
    subscribeCorePilotChecklist,
    () => getCorePilotChecklistStorageSnapshot(),
    getServerSnapshot,
  );

  void snapshot;

  const progress = readCorePilotProgressSnapshot();

  if (progress.allDone) {
    return null;
  }

  const nextStep =
    progress.nextStepIndex !== null ? CORE_PILOT_STEPS[progress.nextStepIndex] : null;
  const remainingSteps = progress.totalCount - progress.completedCount;
  const estimatedMinutes = Math.max(5, Math.round((remainingSteps / progress.totalCount) * FIRST_VALUE_MINUTES_ESTIMATE));

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50",
        props.className,
      )}
      data-testid="core-pilot-progress-tracker"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            First proof progress — {progress.completedCount} of {progress.totalCount} steps
          </p>
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            About {estimatedMinutes} min remaining · see{" "}
            <Link href="/help/first-value-20-minutes" className="font-medium text-teal-800 underline dark:text-teal-300">
              first value in ~{FIRST_VALUE_MINUTES_ESTIMATE} minutes
            </Link>
          </p>
          {nextStep !== null ? (
            <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
              Next: <span className="font-medium">{nextStep.title}</span>
            </p>
          ) : null}
        </div>
        {nextStep !== null ? (
          <Button asChild type="button" size="sm" variant="default">
            <Link href={nextStep.primaryHref}>{nextStep.primaryLabel}</Link>
          </Button>
        ) : null}
      </div>
      {!props.compact ? (
        <ol className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Core pilot steps">
          {CORE_PILOT_STEPS.map((step, index) => {
            const snapshot = getCorePilotChecklistStorageSnapshot();
            const done = snapshot[index] === "1";

            return (
              <li
                key={step.title}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  done
                    ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200"
                    : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                )}
              >
                {index + 1}. {step.title}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
