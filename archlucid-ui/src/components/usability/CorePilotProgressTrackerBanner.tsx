"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StepProgressMeter } from "@/components/ui/step-progress-meter";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE } from "@/lib/persistent-workspace-next-action";
import { formatStepProgressCompleteLabel } from "@/lib/step-progress-label";
import {
  FIRST_VALUE_MINUTES_ESTIMATE,
} from "@/lib/usability/core-pilot-progress-tracker";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";

type CorePilotProgressTrackerBannerProps = {
  readonly className?: string;
  readonly compact?: boolean;
};

/**
 * Cross-page first-review progress tracker with time-to-value estimate.
 * Derived from tenant/review lifecycle (same signals as {@link CorePilotChecklist}).
 */
export function CorePilotProgressTrackerBanner(props: CorePilotProgressTrackerBannerProps) {
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
  const progressCountLabel = formatStepProgressCompleteLabel(progress.completedCount, progress.totalCount);

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50",
        props.className,
      )}
      data-testid="core-pilot-progress-tracker"
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE}
            </p>
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.dataValue)}>
              {progressCountLabel}
            </p>
          </div>
          <StepProgressMeter
            completedCount={progress.completedCount}
            totalCount={progress.totalCount}
            label={PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE}
            valueText={progressCountLabel}
          />
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
      {!props.compact ? (
        <ol className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Core pilot steps">
          {CORE_PILOT_STEPS.map((step, index) => {
            const done = statuses[index] === "done";

            return (
              <li
                key={step.title}
                className={cn("rounded-full px-2.5 py-0.5 font-medium", OPERATOR_TYPOGRAPHY.helper,
                  done
                    ? "bg-neutral-100 text-al-text-primary dark:bg-neutral-900 dark:text-neutral-100"
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
