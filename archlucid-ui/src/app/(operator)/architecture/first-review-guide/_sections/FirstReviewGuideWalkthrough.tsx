"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FirstReviewGuideStepPresentation } from "@/lib/first-review-guide-state";

type FirstReviewGuideWalkthroughProps = {
  readonly steps: readonly FirstReviewGuideStepPresentation[];
  readonly isPending: boolean;
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

export function FirstReviewGuideWalkthrough({ steps, isPending }: FirstReviewGuideWalkthroughProps) {
  if (isPending) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="first-review-guide-walkthrough-loading">
        Loading review progress…
      </p>
    );
  }

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
          <div className="flex flex-wrap items-start gap-2">
            <span className={cn("font-medium text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              {step.index + 1}.
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{step.title}</h3>
                <StatusTag kind={stepStatusTagKind(step.status)} label={step.statusLabel} />
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
          </div>
        </li>
      ))}
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
