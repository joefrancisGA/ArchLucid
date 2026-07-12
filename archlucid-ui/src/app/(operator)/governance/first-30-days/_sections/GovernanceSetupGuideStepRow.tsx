import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { presentGovernanceSetupStepStatus } from "./governance-setup-step-status-present";
import type { GovernanceSetupStepDefinition, GovernanceSetupStepStatus } from "./governance-setup-guide-types";

type GovernanceSetupGuideStepRowProps = {
  readonly step: GovernanceSetupStepDefinition;
  readonly status: GovernanceSetupStepStatus;
  readonly recommendedNext: boolean;
};

export function GovernanceSetupGuideStepRow({
  step,
  status,
  recommendedNext,
}: GovernanceSetupGuideStepRowProps) {
  const statusPresentation = presentGovernanceSetupStepStatus(status);

  return (
    <li
      className={cn(
        "rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40",
        recommendedNext
          ? "border-l-4 border-l-teal-700 bg-teal-50/30 dark:border-l-teal-500 dark:bg-teal-950/15"
          : null,
      )}
      data-testid={recommendedNext ? "governance-setup-recommended-step" : `governance-setup-step-${step.stepNumber}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
              Step {step.stepNumber}
            </span>
            {recommendedNext ? (
              <span className={cn("font-medium text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.micro)}>
                Recommended next step
              </span>
            ) : null}
          </div>
          <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {step.title}
          </h2>
          <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {step.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-col lg:items-end">
          <StatusTag kind={statusPresentation.kind} label={statusPresentation.label} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href={step.primaryActionHref}>{step.primaryActionLabel}</Link>
            </Button>
            {step.secondaryActionHref !== undefined && step.secondaryActionLabel !== undefined ? (
              <Link className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)} href={step.secondaryActionHref}>
                {step.secondaryActionLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
