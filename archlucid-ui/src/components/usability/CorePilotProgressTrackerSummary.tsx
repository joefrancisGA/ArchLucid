"use client";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import {
  FIRST_VALUE_MINUTES_ESTIMATE,
} from "@/lib/usability/core-pilot-progress-tracker";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CorePilotProgressTrackerSummaryProps = {
  readonly className?: string;
  readonly showStepPills?: boolean;
  readonly headingId?: string;
};

/** Shared progress header for first-review checklist surfaces — derived from tenant/review lifecycle. */
export function CorePilotProgressTrackerSummary(props: CorePilotProgressTrackerSummaryProps): React.JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { progress, statuses } = useCorePilotDerivedStepStatus();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canOpenInternalRunbook = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  const progressSnapshot = progress;

  if (progressSnapshot.allDone) {
    return null;
  }

  const nextStep =
    progressSnapshot.nextStepIndex !== null ? CORE_PILOT_STEPS[progressSnapshot.nextStepIndex] : null;
  const nextStepPresentation =
    progressSnapshot.nextStepIndex !== null
      ? resolveCorePilotStepPresentation(progressSnapshot.nextStepIndex, commitPresentationContext)
      : null;
  const remainingSteps = progressSnapshot.totalCount - progressSnapshot.completedCount;
  const estimatedMinutes = Math.max(
    5,
    Math.round((remainingSteps / progressSnapshot.totalCount) * FIRST_VALUE_MINUTES_ESTIMATE),
  );

  return (
    <div className={cn("space-y-2", props.className)} data-testid="core-pilot-progress-tracker-summary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p
            id={props.headingId}
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            First review progress — {progressSnapshot.completedCount} of {progressSnapshot.totalCount} steps
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            About {estimatedMinutes} minutes remaining
            <>
              {" · "}
              <Link
                href={canOpenInternalRunbook ? FIRST_VALUE_20_HELP_PATH : FIRST_ARCHITECTURE_REVIEW_HELP_PATH}
                className={OPERATOR_LINK.optional}
              >
                Complete one review in about {FIRST_VALUE_MINUTES_ESTIMATE} minutes
              </Link>
            </>
          </p>
          {nextStep !== null ? (
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              <InlineGuidanceLabel label="Next:" testId="inline-guidance-next" />{" "}
              <span className="font-medium">{nextStep.title}</span>
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
            const done = statuses[index] === "done";

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
