"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import {
  getCorePilotChecklistStorageServerSnapshot,
  getCorePilotChecklistStorageSnapshot,
  subscribeCorePilotChecklist,
} from "@/lib/core-pilot-checklist-storage";
import {
  FIRST_VALUE_MINUTES_ESTIMATE,
  parseCorePilotProgressFromSnapshot,
} from "@/lib/usability/core-pilot-progress-tracker";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";

type CorePilotProgressTrackerBannerProps = {
  readonly className?: string;
  readonly compact?: boolean;
};

/**
 * Cross-page "5 steps to first review package" tracker with time-to-value estimate.
 * Reads the same localStorage keys as {@link CorePilotChecklist}.
 *
 * Defers render until client hydration (localStorage is unavailable on SSR).
 */
export function CorePilotProgressTrackerBanner(props: CorePilotProgressTrackerBannerProps) {
  const [hydrated, setHydrated] = useState(false);
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const storageSnapshot = useSyncExternalStore(
    subscribeCorePilotChecklist,
    getCorePilotChecklistStorageSnapshot,
    getCorePilotChecklistStorageServerSnapshot,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  const progress = parseCorePilotProgressFromSnapshot(storageSnapshot);

  if (progress.allDone) {
    return null;
  }

  const nextStep =
    progress.nextStepIndex !== null ? CORE_PILOT_STEPS[progress.nextStepIndex] : null;
  const nextStepPresentation =
    progress.nextStepIndex !== null
      ? resolveCorePilotStepPresentation(progress.nextStepIndex, commitPresentationContext)
      : null;
  const remainingSteps = progress.totalCount - progress.completedCount;
  const estimatedMinutes = Math.max(
    5,
    Math.round((remainingSteps / progress.totalCount) * FIRST_VALUE_MINUTES_ESTIMATE),
  );

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
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            First review progress — {progress.completedCount} of {progress.totalCount} steps
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            About {estimatedMinutes} minutes remaining
            {" · "}
            <Link href="/help/first-value-20-minutes" className="font-medium text-teal-800 underline dark:text-teal-300">
              Complete one review package in about {FIRST_VALUE_MINUTES_ESTIMATE} minutes
            </Link>
          </p>
          {nextStep !== null ? (
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              Next: <span className="font-medium">{nextStep.title}</span>
            </p>
          ) : null}
        </div>
        {nextStepPresentation !== null ? (
          <Button asChild type="button" size="sm" variant="default">
            <Link href={nextStepPresentation.href}>{nextStepPresentation.label}</Link>
          </Button>
        ) : null}
      </div>
      {!props.compact ? (
        <ol className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Core pilot steps">
          {CORE_PILOT_STEPS.map((step, index) => {
            const done = storageSnapshot[index] === "1";

            return (
              <li
                key={step.title}
                className={cn("rounded-full px-2.5 py-0.5 font-medium", OPERATOR_TYPOGRAPHY.helper,
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
