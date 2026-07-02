"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import {
  getCorePilotChecklistStorageServerSnapshot,
  getCorePilotChecklistStorageSnapshot,
  subscribeCorePilotChecklist,
} from "@/lib/core-pilot-checklist-storage";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import {
  FIRST_VALUE_MINUTES_ESTIMATE,
  parseCorePilotProgressFromSnapshot,
} from "@/lib/usability/core-pilot-progress-tracker";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CorePilotProgressTrackerSummaryProps = {
  readonly className?: string;
  readonly showStepPills?: boolean;
  readonly headingId?: string;
};

/** Shared progress header for first-review checklist surfaces — reads the same localStorage as {@link CorePilotChecklist}. */
export function CorePilotProgressTrackerSummary(props: CorePilotProgressTrackerSummaryProps): React.JSX.Element | null {
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
    <div className={cn("space-y-2", props.className)} data-testid="core-pilot-progress-tracker-summary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p
            id={props.headingId}
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
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
      {props.showStepPills === true ? (
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Core pilot steps">
          {CORE_PILOT_STEPS.map((step, index) => {
            const done = storageSnapshot[index] === "1";

            return (
              <li
                key={step.title}
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium",
                  OPERATOR_TYPOGRAPHY.helper,
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
