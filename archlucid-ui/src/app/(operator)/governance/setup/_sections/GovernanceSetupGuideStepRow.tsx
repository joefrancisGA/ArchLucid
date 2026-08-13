import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { presentGovernanceSetupStepStatus } from "./governance-setup-step-status-present";
import type { GovernanceSetupStepDefinition, GovernanceSetupStepStatus } from "./governance-setup-guide-types";
import { resolveGovernanceSetupStepCtaVariant } from "./resolve-governance-setup-step-cta-variant";
import {
  GOVERNANCE_SETUP_STEP_COMPLETE_SR_LABEL,
  GOVERNANCE_SETUP_STEP_NOT_TRACKED_HELPER,
  GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL,
} from "./governance-setup-progress-copy";

type GovernanceSetupGuideStepRowProps = {
  readonly step: GovernanceSetupStepDefinition;
  readonly status: GovernanceSetupStepStatus;
  readonly recommendedNext: boolean;
  readonly isLast: boolean;
};

function resolveStepMarkerClass(args: {
  readonly recommendedNext: boolean;
  readonly status: GovernanceSetupStepStatus;
}): string {
  if (args.status === "complete") {
    return "border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-200";
  }

  if (args.recommendedNext) {
    return "border-[var(--al-accent-interactive)] bg-[var(--al-accent-interactive)] text-white";
  }

  return "border-neutral-300 bg-white text-neutral-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-300";
}

export function GovernanceSetupGuideStepRow({
  step,
  status,
  recommendedNext,
  isLast,
}: GovernanceSetupGuideStepRowProps) {
  // Presented as-is rather than collapsing every non-complete status to "Not started": the resolver
  // no longer infers in-progress, but if a real workspace signal ever reports it, hiding it here
  // would be the same dishonesty this route was just fixed for.
  const trackedStatusPresentation = presentGovernanceSetupStepStatus(status);
  const untrackedStatusPresentation = {
    kind: "neutral" as const,
    label: GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL,
  };
  const ctaVariant = resolveGovernanceSetupStepCtaVariant({ recommendedNext, status });

  return (
    <li
      className="relative flex gap-3"
      data-testid={recommendedNext ? "governance-setup-recommended-step" : `governance-setup-step-${step.stepNumber}`}
    >
      <div className="relative flex w-8 shrink-0 justify-center">
        {isLast ? null : (
          <span
            className="absolute top-7 bottom-0 w-px bg-neutral-300 dark:bg-neutral-700"
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
            resolveStepMarkerClass({ recommendedNext, status }),
          )}
        >
          {status === "complete" ? (
            <>
              <span aria-hidden="true">✓</span>
              <span className="sr-only">{GOVERNANCE_SETUP_STEP_COMPLETE_SR_LABEL}</span>
            </>
          ) : (
            // Hidden from assistive tech because the row already carries a "Step N" label; the
            // status itself now reaches screen readers through the StatusTag below.
            <span aria-hidden="true">{step.stepNumber}</span>
          )}
        </span>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-md border px-3 py-3",
          isLast ? "mb-0" : "mb-3",
          recommendedNext
            ? "border-[var(--al-accent-interactive)] bg-white shadow-sm dark:bg-neutral-950/60"
            : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/40",
          status === "complete" && !recommendedNext ? "opacity-80" : null,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                Step {step.stepNumber}
              </span>
              {recommendedNext ? (
                <span className={cn("font-medium text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.micro)}>
                  Recommended next
                </span>
              ) : null}
            </div>
            <h2
              className={cn(
                "m-0 font-semibold text-neutral-900 dark:text-neutral-50",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {step.title}
            </h2>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {step.description}
            </p>
            <p
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid={`governance-setup-step-${step.stepNumber}-outcome`}
            >
              {step.outcome}
            </p>
            {step.tracked ? null : (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {GOVERNANCE_SETUP_STEP_NOT_TRACKED_HELPER}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {step.tracked ? (
              <StatusTag kind={trackedStatusPresentation.kind} label={trackedStatusPresentation.label} />
            ) : (
              <StatusTag kind={untrackedStatusPresentation.kind} label={untrackedStatusPresentation.label} />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={ctaVariant}
                size="sm"
                asChild
                data-testid={`governance-setup-step-${step.stepNumber}-cta`}
                data-cta-variant={ctaVariant}
              >
                <Link href={step.primaryActionHref}>{step.primaryActionLabel}</Link>
              </Button>
              {step.secondaryActionHref !== undefined && step.secondaryActionLabel !== undefined ? (
                <Link
                  className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
                  href={step.secondaryActionHref}
                >
                  {step.secondaryActionLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
