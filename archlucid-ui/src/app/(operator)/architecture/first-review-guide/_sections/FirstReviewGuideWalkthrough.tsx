"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE, FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_REVIEW_GUIDE_STEP_COUNT } from "@/lib/first-review-guide-steps";
import {
  FIRST_REVIEW_GUIDE_PATH,
  firstReviewGuideWalkthroughStepHrefFromSearch,
  parseFirstReviewGuideWalkthroughStepFromSearch,
} from "@/lib/first-review-guide/first-review-guide-walkthrough-step-url";
import {
  firstReviewGuideLedgerHrefFromSearch,
  parseFirstReviewGuideLedgerExpandedFromSearch,
} from "@/lib/first-review-guide/first-review-guide-ledger-url";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type {
  FirstReviewGuideProgressPhase,
  FirstReviewGuideStepPresentation,
} from "@/lib/first-review-guide-state";
import { formatStepProgressCompleteLabel } from "@/lib/step-progress-label";
import { scheduleScrollDeepLinkTargetIntoView } from "@/lib/scroll-deep-link-target-into-view";

type FirstReviewGuideWalkthroughProps = {
  readonly steps: readonly FirstReviewGuideStepPresentation[];
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly announceProgress: boolean;
  readonly progressPhase: FirstReviewGuideProgressPhase;
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

function FirstReviewGuideStepCard({
  step,
  totalSteps,
  onFocusStep,
}: {
  readonly step: FirstReviewGuideStepPresentation;
  readonly totalSteps: number;
  readonly onFocusStep: (stepNumber: number) => void;
}) {
  const stepNumber = step.index + 1;
  const stepElementId = `first-review-guide-step-${stepNumber}`;

  return (
    <li
      id={stepElementId}
      tabIndex={-1}
      className={cn(
        OPERATOR_SURFACE_CARD_CLASS,
        "border border-neutral-200 p-4 dark:border-neutral-800",
        step.isNextStep ? "border-l-4 border-l-neutral-700 dark:border-l-neutral-400" : null,
      )}
      data-testid={step.isNextStep ? "first-review-guide-next-step" : stepElementId}
      aria-current={step.isNextStep ? "step" : undefined}
      onFocus={() => {
        onFocusStep(stepNumber);
      }}
    >
      <div className="min-w-0 space-y-1">
        <span className="sr-only">
          Step {step.index + 1} of {totalSteps}
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            <span className="font-semibold text-neutral-500 tabular-nums dark:text-neutral-400" aria-hidden="true">
              {step.index + 1}.{" "}
            </span>
            {step.title}
          </h3>
          {step.isNextStep && step.status === "not-started" ? null : (
            <StatusTag kind={stepStatusTagKind(step.status)} label={step.statusLabel} />
          )}
          {step.isNextStep ? (
            <span className={cn("font-medium text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
              {FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL}
            </span>
          ) : null}
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-700 dark:text-neutral-300")}>
          {step.explanation}
        </p>
        {step.actionLabel !== null && step.actionHref !== null ? (
          <Link
            href={step.actionHref}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
            onFocus={() => {
              onFocusStep(stepNumber);
            }}
          >
            {step.actionLabel}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function FirstReviewGuideWalkthrough({
  steps,
  isPending,
  isError,
  announceProgress,
  progressPhase,
}: FirstReviewGuideWalkthroughProps) {
  const router = useRouter();
  const pathname = usePathname() ?? FIRST_REVIEW_GUIDE_PATH;
  const searchParams = useSearchParams();
  const urlGuideStep = parseFirstReviewGuideWalkthroughStepFromSearch(searchParams.get("guideStep"));
  const urlLedgerExpanded = parseFirstReviewGuideLedgerExpandedFromSearch(searchParams.get("ledger"));
  const scrolledStepRef = useRef<number | null>(null);
  const ledgerPanelId = useId().replaceAll(":", "");
  const [ledgerExpanded, setLedgerExpandedState] = useState(urlLedgerExpanded);

  const syncGuideStepToUrl = (stepNumber: number | null) => {
    router.replace(
      firstReviewGuideWalkthroughStepHrefFromSearch(searchParams.toString(), stepNumber, pathname),
      { scroll: false },
    );
  };

  const setLedgerExpanded = (next: boolean | ((expanded: boolean) => boolean)) => {
    setLedgerExpandedState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;

      router.replace(
        firstReviewGuideLedgerHrefFromSearch(searchParams.toString(), resolved, pathname),
        { scroll: false },
      );

      return resolved;
    });
  };

  useEffect(() => {
    setLedgerExpandedState(urlLedgerExpanded);
  }, [urlLedgerExpanded]);

  const focusGuideStep = (stepNumber: number) => {
    syncGuideStepToUrl(stepNumber);
    scheduleScrollDeepLinkTargetIntoView(`first-review-guide-step-${stepNumber}`);
  };

  useEffect(() => {
    if (urlGuideStep === null || isPending || isError) {
      return;
    }

    if (scrolledStepRef.current === urlGuideStep) {
      return;
    }

    scrolledStepRef.current = urlGuideStep;

    if (progressPhase === "complete" && !ledgerExpanded) {
      setLedgerExpanded(true);
    }

    scheduleScrollDeepLinkTargetIntoView(`first-review-guide-step-${urlGuideStep}`);
  }, [isError, isPending, ledgerExpanded, progressPhase, urlGuideStep]);

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
  const completedStepCount = steps.filter((step) => step.status === "complete").length;
  const completionLabel = formatStepProgressCompleteLabel(completedStepCount, totalSteps);
  const isCompletedState = progressPhase === "complete";

  if (isCompletedState) {
    return (
      <div className="space-y-3" data-testid="first-review-guide-walkthrough-completed-summary">
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={ledgerExpanded}
            aria-controls={ledgerPanelId}
            data-testid="first-review-guide-walkthrough-ledger-toggle"
            onClick={() => {
              setLedgerExpanded((expanded) => !expanded);
            }}
          >
            {ledgerExpanded ? (
              <>
                <ChevronUp className="mr-1.5 h-4 w-4" aria-hidden />
                Hide step ledger
              </>
            ) : (
              <>
                <ChevronDown className="mr-1.5 h-4 w-4" aria-hidden />
                View step ledger
              </>
            )}
          </Button>

          {ledgerExpanded ? (
            <ol
              id={ledgerPanelId}
              className="m-0 mt-3 list-none space-y-3 p-0"
              data-testid="first-review-guide-walkthrough"
              aria-label="First review walkthrough"
            >
              {steps.map((step) => (
                <FirstReviewGuideStepCard
                  key={step.title}
                  step={step}
                  totalSteps={totalSteps}
                  onFocusStep={focusGuideStep}
                />
              ))}
            </ol>
          ) : null}
        </div>

        {announceProgress ? (
          <span className="sr-only" aria-live="polite" data-testid="first-review-guide-walkthrough-live">
            {FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <ol
      className="m-0 list-none space-y-3 p-0"
      data-testid="first-review-guide-walkthrough"
      aria-label="First review walkthrough"
    >
      {steps.map((step) => (
        <FirstReviewGuideStepCard
          key={step.title}
          step={step}
          totalSteps={totalSteps}
          onFocusStep={focusGuideStep}
        />
      ))}
      {announceProgress ? (
        <span className="sr-only" aria-live="polite" data-testid="first-review-guide-walkthrough-live">
          {completionLabel}
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
      ? { label: "Seal review", href: finalizeHref }
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
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{step?.title ?? "Seal the review record"}</p>
      <div className="mt-3">
        <Button asChild size="sm" variant="default">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      </div>
    </section>
  );
}
