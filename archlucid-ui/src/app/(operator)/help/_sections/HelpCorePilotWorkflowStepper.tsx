"use client";

import Link from "next/link";

import { HelpCorePilotWorkflowGateNote } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowGateNote";
import { Button } from "@/components/ui/button";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { CORE_PILOT_HELP_WORKFLOW_STEPS, type CorePilotHelpWorkflowStep } from "@/lib/core-pilot-help-guide-content";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isCorePilotHelpStartReviewFirstCta,
  resolveCorePilotHelpWorkflowStepCta,
  type CorePilotHelpWorkflowStepCta,
} from "@/lib/resolve-core-pilot-help-workflow-step-cta";

type ResolvedWorkflowStep = {
  readonly step: CorePilotHelpWorkflowStep;
  readonly cta: CorePilotHelpWorkflowStepCta;
};

function StepCta(props: {
  readonly cta: CorePilotHelpWorkflowStepCta;
  readonly stepNumber: number;
}): React.ReactElement {
  const { cta, stepNumber } = props;

  if (cta.enabled && cta.href !== null) {
    return (
      <Button asChild size="sm" variant="outline" data-testid={`core-pilot-step-${stepNumber}-cta`}>
        <Link href={cta.href}>{cta.label}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled data-testid={`core-pilot-step-${stepNumber}-cta`}>
      {cta.label}
    </Button>
  );
}

/**
 * Five-step first-review stepper with commit-aware CTAs for steps 3–5 (TB-1042).
 * When several steps resolve to the same "no review yet" gate, the control is shown once
 * below the list rather than repeated identically on each step.
 */
export function HelpCorePilotWorkflowStepper(): React.ReactElement {
  const commitQuery = useCorePilotCommitContextQuery();
  const ctx = commitQuery.isPending ? null : (commitQuery.data ?? null);

  const resolvedSteps: readonly ResolvedWorkflowStep[] = CORE_PILOT_HELP_WORKFLOW_STEPS.map((step) => ({
    step,
    cta: resolveCorePilotHelpWorkflowStepCta(step, ctx),
  }));

  const gatedSteps = resolvedSteps.filter((entry) => isCorePilotHelpStartReviewFirstCta(entry.cta));
  const groupGate = gatedSteps.length > 1;
  const gateCta = gatedSteps[0]?.cta ?? null;

  return (
    <div data-testid="core-pilot-workflow-stepper">
      <ol className="m-0 list-none space-y-0 p-0">
        {resolvedSteps.map((entry, index) => {
          const { step, cta } = entry;
          const isLast = index === resolvedSteps.length - 1;
          const deferToGroupGate = groupGate && isCorePilotHelpStartReviewFirstCta(cta);

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
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{step.title}</h3>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
                <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  <span className="font-medium text-al-text-primary">Expected output:</span> {step.expectedOutput}
                </p>

                {!deferToGroupGate ? <StepCta cta={cta} stepNumber={step.stepNumber} /> : null}

                {!deferToGroupGate && cta.helperText !== null ? (
                  <p
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid={`core-pilot-step-${step.stepNumber}-helper`}
                  >
                    {cta.helperText}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {groupGate && gateCta !== null ? (
        <HelpCorePilotWorkflowGateNote
          cta={gateCta}
          gatedStepNumbers={gatedSteps.map((entry) => entry.step.stepNumber)}
        />
      ) : null}
    </div>
  );
}
