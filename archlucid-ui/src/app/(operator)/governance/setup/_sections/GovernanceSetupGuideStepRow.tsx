import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { presentGovernanceSetupStepStatus } from "./governance-setup-step-status-present";
import type { GovernanceSetupStepDefinition, GovernanceSetupStepStatus } from "./governance-setup-guide-types";
import { resolveGovernanceSetupStepCtaVariant } from "./resolve-governance-setup-step-cta-variant";

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
  const statusPresentation = presentGovernanceSetupStepStatus(status);
  const ctaVariant = resolveGovernanceSetupStepCtaVariant({ recommendedNext, status });
  const showStatusTag = status !== "not-started" || recommendedNext;

  return (
    <li
      className="relative flex gap-3"
      data-testid={recommendedNext ? "governance-setup-recommended-step" : `governance-setup-step-${step.stepNumber}`}
    >
      <div className="relative flex w-8 shrink-0 justify-center" aria-hidden="true">
        {isLast ? null : (
          <span className="absolute top-7 bottom-0 w-px bg-neutral-300 dark:bg-neutral-700" />
        )}
        <span
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
            resolveStepMarkerClass({ recommendedNext, status }),
          )}
        >
          {status === "complete" ? "✓" : step.stepNumber}
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
              <span className="font-medium">Outcome:</span> {step.outcome}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {showStatusTag ? (
              <StatusTag kind={statusPresentation.kind} label={statusPresentation.label} />
            ) : null}
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
