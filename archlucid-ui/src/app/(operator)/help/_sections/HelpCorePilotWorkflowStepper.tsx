"use client";

import Link from "next/link";

import { HelpCorePilotWorkflowGateNote } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowGateNote";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import {
  CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS,
  CORE_PILOT_HELP_WORKFLOW_STEPS,
  type CorePilotHelpWorkflowStep,
} from "@/lib/core-pilot-help-guide-content";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import {
  isCorePilotHelpStartReviewFirstCta,
  isCorePilotHelpWorkflowContextPendingCta,
  resolveCorePilotHelpWorkflowStepCta,
  type CorePilotHelpWorkflowStepCta,
} from "@/lib/resolve-core-pilot-help-workflow-step-cta";
import { resolveCorePilotHelpWorkflowStepStatus } from "@/lib/resolve-core-pilot-help-workflow-step-status";

const EMPTY_COMMIT_CONTEXT: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

const WORKFLOW_STEP_TOTAL = CORE_PILOT_HELP_WORKFLOW_STEPS.length;

type ResolvedWorkflowStep = {
  readonly step: CorePilotHelpWorkflowStep;
  readonly cta: CorePilotHelpWorkflowStepCta;
};

function StepOrdinalLabel(props: { readonly stepNumber: number }): React.ReactElement {
  return (
    <span className="sr-only">
      Step {props.stepNumber} of {WORKFLOW_STEP_TOTAL}{" "}
    </span>
  );
}

function StepCta(props: {
  readonly cta: CorePilotHelpWorkflowStepCta;
  readonly stepNumber: number;
}): React.ReactElement | null {
  const { cta, stepNumber } = props;

  if (isCorePilotHelpWorkflowContextPendingCta(cta)) {
    return null;
  }

  if (!cta.enabled && cta.href === null && cta.helperText === null) {
    return null;
  }

  if (cta.enabled && cta.href !== null) {
    return (
      <Button asChild size="sm" variant="outline" data-testid={`core-pilot-step-${stepNumber}-cta`}>
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant="outline" disabled data-testid={`core-pilot-step-${stepNumber}-cta`}>
        {cta.label}
      </Button>
      {cta.helperText !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`core-pilot-step-${stepNumber}-helper`}>
          {cta.helperText}
        </p>
      ) : null}
    </div>
  );
}

function StepSecondaryLinks(props: {
  readonly step: CorePilotHelpWorkflowStep;
  readonly ctx: CorePilotCommitContext;
}): React.ReactElement | null {
  const { step, ctx } = props;
  const runId = ctx.latestRunId ?? ctx.firstCommittedRunId;

  if (runId === null) {
    return null;
  }

  if (step.stepNumber === 3) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <Link
          href={buildReviewDetailTabHref(runId, "findings")}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          data-testid="core-pilot-step-3-findings-link"
        >
          Review findings
        </Link>
        {" · "}
        <Link
          href={inAppHelpHref("evidence-trail")}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
          data-testid="core-pilot-step-3-evidence-trail-link"
        >
          Evidence trail guide
        </Link>
      </p>
    );
  }

  return null;
}

function StepContextPendingPlaceholder(props: { readonly stepNumber: number }): React.ReactElement {
  return (
    <div
      className="space-y-1"
      aria-busy="true"
      aria-live="polite"
      data-testid={`core-pilot-step-${props.stepNumber}-pending`}
    >
      <span className="sr-only">Checking workspace status for step {props.stepNumber}.</span>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`core-pilot-step-${props.stepNumber}-pending-label`}>
        {CORE_PILOT_HELP_WORKFLOW_CHECKING_STATUS}
      </p>
      <div className="h-8 w-36 rounded-md bg-neutral-100 dark:bg-neutral-800/80" />
    </div>
  );
}

/**
 * Five-step first-review stepper with commit-aware CTAs for steps 3–5 (TB-1042).
 * When several steps resolve to the same "no review yet" gate, the control is shown once
 * below the list rather than repeated identically on each step.
 */
export function HelpCorePilotWorkflowStepper(): React.ReactElement {
  const commitQuery = useCorePilotCommitContextQuery();
  const isPending = commitQuery.isPending;
  const isError = commitQuery.isError;

  const statusContext: CorePilotCommitContext =
    isPending || isError ? EMPTY_COMMIT_CONTEXT : (commitQuery.data ?? EMPTY_COMMIT_CONTEXT);

  const resolutionContext: CorePilotCommitContext | null = isPending ? null : statusContext;

  const resolvedSteps: readonly ResolvedWorkflowStep[] = CORE_PILOT_HELP_WORKFLOW_STEPS.map((step) => ({
    step,
    cta: resolveCorePilotHelpWorkflowStepCta(step, resolutionContext),
  }));

  const gatedSteps = resolvedSteps.filter((entry) => isCorePilotHelpStartReviewFirstCta(entry.cta));
  const groupGate = gatedSteps.length > 1;
  const gateCta = gatedSteps[0]?.cta ?? null;
  const showGroupGate = groupGate && gateCta !== null && !isPending;

  return (
    <div data-testid="core-pilot-workflow-stepper">
      <ol className="m-0 list-none space-y-0 p-0">
        {resolvedSteps.map((entry, index) => {
          const { step, cta } = entry;
          const isLast = index === resolvedSteps.length - 1;
          const deferToGroupGate = groupGate && isCorePilotHelpStartReviewFirstCta(cta);
          const stepStatus = resolveCorePilotHelpWorkflowStepStatus(step, statusContext);
          const showStepCta =
            !deferToGroupGate && !isPending && !isCorePilotHelpWorkflowContextPendingCta(cta);
          const showPendingPlaceholder = isPending && step.stepNumber >= 2;

          return (
            <li key={step.stepNumber} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden
                  className="absolute left-[0.9375rem] top-8 h-[calc(100%-1.5rem)] w-px bg-neutral-200 dark:bg-neutral-700"
                />
              ) : null}
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {step.stepNumber}
              </span>
              <div className="min-w-0 flex-1 space-y-2 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    <StepOrdinalLabel stepNumber={step.stepNumber} />
                    {step.title}
                  </h3>
                  <StatusTag
                    kind={stepStatus.kind}
                    label={stepStatus.label}
                    data-testid={`core-pilot-step-${step.stepNumber}-status`}
                  />
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
                <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  <span className="font-medium text-al-text-primary">Expected output:</span> {step.expectedOutput}
                </p>

                {showPendingPlaceholder ? <StepContextPendingPlaceholder stepNumber={step.stepNumber} /> : null}

                {showStepCta ? <StepCta cta={cta} stepNumber={step.stepNumber} /> : null}

                {showStepCta && !isPending ? <StepSecondaryLinks step={step} ctx={statusContext} /> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isError ? (
        <p
          className={cn("m-0 mt-4", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="core-pilot-workflow-context-error"
        >
          Couldn&apos;t check workspace status. You can still start a review.
        </p>
      ) : null}

      {showGroupGate ? (
        <HelpCorePilotWorkflowGateNote
          cta={gateCta}
          gatedStepNumbers={gatedSteps.map((entry) => entry.step.stepNumber)}
        />
      ) : null}
    </div>
  );
}
