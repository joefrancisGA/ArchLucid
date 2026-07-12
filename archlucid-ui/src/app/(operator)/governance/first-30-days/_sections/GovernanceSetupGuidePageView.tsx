import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceSetupFoundationPanel } from "./GovernanceSetupFoundationPanel";
import { GovernanceSetupGuideProgressSummary } from "./GovernanceSetupGuideProgressSummary";
import { GovernanceSetupGuideStepRow } from "./GovernanceSetupGuideStepRow";
import { summarizeGovernanceSetupProgress } from "./governance-setup-guide-steps";
import type { GovernanceSetupGuideViewModel } from "./governance-setup-guide-types";

type GovernanceSetupGuidePageViewProps = {
  readonly model: GovernanceSetupGuideViewModel;
};

export function GovernanceSetupGuidePageView({ model }: GovernanceSetupGuidePageViewProps) {
  const progress = summarizeGovernanceSetupProgress(model.stepStatuses);

  return (
    <div
      className="w-full max-w-[68rem] space-y-5 px-1 py-4 sm:px-0"
      data-testid="governance-setup-guide-page"
    >
      <OperatorPageHeader
        title="Governance setup"
        titleTestId="governance-setup-page-title"
        subtitle="Establish the core policies, alerts, approvals, and reporting your workspace needs."
        metadata={
          <span
            className={cn(
              "inline-flex items-center rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900/60 dark:text-neutral-300",
              OPERATOR_TYPOGRAPHY.micro,
            )}
          >
            First 30 days
          </span>
        }
      >
        <GovernanceSetupGuideProgressSummary summary={progress} />
      </OperatorPageHeader>

      <p
        className={cn(
          "m-0 max-w-3xl text-neutral-600 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="governance-setup-configuration-note"
      >
        This guide links to the existing ArchLucid configuration areas. Changes are made and audited in those
        workspaces.
      </p>

      <ol className="m-0 list-none space-y-3 p-0" aria-label="Governance setup steps">
        {model.steps.map((step, index) => (
          <GovernanceSetupGuideStepRow
            key={step.stepNumber}
            step={step}
            status={model.stepStatuses[index] ?? "not-started"}
            recommendedNext={progress.firstIncompleteIndex === index}
          />
        ))}
      </ol>

      <GovernanceSetupFoundationPanel
        indicators={model.foundationIndicators}
        stepStatuses={model.stepStatuses}
      />
    </div>
  );
}
