"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_REVIEW_GUIDE_STEP_COUNT } from "@/lib/first-review-guide-steps";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FirstReviewGuideStepPresentation } from "@/lib/first-review-guide-state";

type FirstReviewGuideWalkthroughProps = {
  readonly steps: readonly FirstReviewGuideStepPresentation[];
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly announceProgress: boolean;
};

function stepStatusTagKind(
  status: FirstReviewGuideStepPresentation["status"],
): "ready" | "in-progress" | "draft" | "neutral" | "needs-attention" {
  switch (status) {
    case "complete":
      return "ready";
    case "current":
      return "in-progress";
    case "blocked":
      return "needs-attention";
    case "not-started":
      return "draft";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function FirstReviewGuideWalkthroughLoadingSkeleton() {
  return (
    <div
      className="space-y-3"
      data-testid="first-review-guide-walkthrough-loading"
      aria-busy="true"
      aria-label="Loading first review walkthrough"
    >
      <Skeleton className="h-24 w-full" aria-hidden />
      <Skeleton className="h-24 w-full" aria-hidden />
      <Skeleton className="h-24 w-full" aria-hidden />
    </div>
  );
}

export function FirstReviewGuideWalkthrough({
  steps,
  isPending,
  isError,
  announceProgress,
}: FirstReviewGuideWalkthroughProps) {
  if (isPending) {
    return <FirstReviewGuideWalkthroughLoadingSkeleton />;
  }

  if (isError) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="first-review-guide-walkthrough-unavailable">
        Walkthrough steps appear after review progress loads.
      </p>
    );
  }

  const totalSteps = steps.length > 0 ? steps.length : FIRST_REVIEW_GUIDE_STEP_COUNT;

  return (
    <ol
      className="m-0 list-none space-y-3 p-0"
      data-testid="first-review-guide-walkthrough"
      aria-label="First review walkthrough"
    >
      {steps.map((step) => (
        <li
          key={step.title}
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "border border-neutral-200 p-4 dark:border-neutral-800",
            step.isNextStep ? "border-l-4 border-l-teal-700 dark:border-l-teal-400" : null,
          )}
          data-testid={step.isNextStep ? "first-review-guide-next-step" : `first-review-guide-step-${step.index + 1}`}
          aria-current={step.isNextStep ? "step" : undefined}
        >
          <div className="min-w-0 space-y-1">
            <span className="sr-only">
              Step {step.index + 1} of {totalSteps}
            </span>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                <span
                  className="font-semibold text-neutral-500 tabular-nums dark:text-neutral-400"
                  aria-hidden="true"
                >
                  {step.index + 1}.{" "}
                </span>
                {step.title}
              </h3>
              {step.isNextStep && step.status === "not-started" ? null : (
                <StatusTag kind={stepStatusTagKind(step.status)} label={step.statusLabel} />
              )}
              {step.isNextStep ? (
                <span className={cn("font-medium text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>
                  {FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL}
                </span>
              ) : null}
            </div>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-700 dark:text-neutral-300")}>
              {step.explanation}
            </p>
            {step.actionLabel !== null && step.actionHref !== null ? (
              <Link href={step.actionHref} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}>
                {step.actionLabel}
              </Link>
            ) : null}
          </div>
        </li>
      ))}
      {announceProgress ? (
        <span className="sr-only" aria-live="polite" data-testid="first-review-guide-walkthrough-live">
          {steps.filter((step) => step.status === "complete").length} of {totalSteps} steps complete
        </span>
      ) : null}
    </ol>
  );
}

type FirstReviewGuideNextActionCardProps = {
  readonly step: FirstReviewGuideStepPresentation | null;
  readonly readyToFinalize: boolean;
  readonly finalizeHref: string | null;
  readonly canExecute: boolean;
};

export function FirstReviewGuideNextActionCard({
  step,
  readyToFinalize,
  finalizeHref,
  canExecute,
}: FirstReviewGuideNextActionCardProps) {
  const finalizeAction =
    readyToFinalize && finalizeHref !== null && canExecute
      ? { label: "Finalize review", href: finalizeHref }
      : null;
  const action =
    finalizeAction ??
    (step !== null && step.actionLabel !== null && step.actionHref !== null
      ? { label: step.actionLabel, href: step.actionHref }
      : null);

  if (action === null) {
    return null;
  }

  return (
    <section
      aria-labelledby="first-review-guide-next-action-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
      data-testid="first-review-guide-next-action-card"
    >
      <h2 id="first-review-guide-next-action-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
        {step?.title ?? "Finalize the review"}
      </p>
      <div className="mt-3">
        <Button asChild size="sm" variant="default">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      </div>
    </section>
  );
}
