"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { CORE_PILOT_HELP_WORKFLOW_STEPS } from "@/lib/core-pilot-help-guide-content";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveCorePilotHelpWorkflowStepCta } from "@/lib/resolve-core-pilot-help-workflow-step-cta";

/** Five-step first-review stepper with commit-aware CTAs for steps 3–5 (TB-1042). */
export function HelpCorePilotWorkflowStepper(): React.ReactElement {
  const commitQuery = useCorePilotCommitContextQuery();
  const ctx = commitQuery.isPending ? null : (commitQuery.data ?? null);

  return (
    <ol className="m-0 list-none space-y-0 p-0" data-testid="core-pilot-workflow-stepper">
      {CORE_PILOT_HELP_WORKFLOW_STEPS.map((step, index) => {
        const isLast = index === CORE_PILOT_HELP_WORKFLOW_STEPS.length - 1;
        const cta = resolveCorePilotHelpWorkflowStepCta(step, ctx);

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
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100",
              )}
            >
              {step.stepNumber}
            </span>
            <div className="min-w-0 flex-1 space-y-2 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{step.title}</h3>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
              <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <span className="font-medium text-al-text-primary">Expected output:</span> {step.expectedOutput}
              </p>
              {cta.enabled && cta.href !== null ? (
                <Button asChild size="sm" variant="outline" data-testid={`core-pilot-step-${step.stepNumber}-cta`}>
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  data-testid={`core-pilot-step-${step.stepNumber}-cta`}
                >
                  {cta.label}
                </Button>
              )}
              {cta.helperText !== null ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid={`core-pilot-step-${step.stepNumber}-helper`}>
                  {cta.helperText}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
