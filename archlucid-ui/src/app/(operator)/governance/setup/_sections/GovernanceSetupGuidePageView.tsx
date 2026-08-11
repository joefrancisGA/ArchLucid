import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/GovernanceSetupConfigHubsVocabularyRail";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_SETUP_PAGE_SUBTITLE } from "@/lib/governance-setup-route";

import { GovernanceSetupFoundationPanel } from "./GovernanceSetupFoundationPanel";
import { GovernanceSetupGuideProgressSummary } from "./GovernanceSetupGuideProgressSummary";
import { GovernanceSetupGuideStepRow } from "./GovernanceSetupGuideStepRow";
import { GovernanceSetupOutcomesPanel } from "./GovernanceSetupOutcomesPanel";
import { summarizeGovernanceSetupProgress } from "./governance-setup-guide-steps";
import type { GovernanceSetupGuideViewModel } from "./governance-setup-guide-types";

type GovernanceSetupGuidePageViewProps = {
  readonly model: GovernanceSetupGuideViewModel;
};

export function GovernanceSetupGuidePageView({ model }: GovernanceSetupGuidePageViewProps) {
  const progress = summarizeGovernanceSetupProgress(model.stepStatuses, model.steps);

  return (
    <div
      className="w-full max-w-5xl space-y-5 px-1 py-4 sm:px-0"
      data-testid="governance-setup-guide-page"
    >
      <OperatorPageHeader
        title="Governance setup"
        titleTestId="governance-setup-page-title"
        subtitle={GOVERNANCE_SETUP_PAGE_SUBTITLE}
      >
        <GovernanceSetupGuideProgressSummary summary={progress} />
      </OperatorPageHeader>

      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="setup" />

      <p
        className={cn(
          "m-0 text-neutral-600 dark:text-neutral-400",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="governance-setup-configuration-note"
      >
        This guide links to the existing ArchLucid configuration areas. Changes are made and audited in those
        workspaces.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,18rem)] lg:items-start">
        <div className="space-y-5 min-w-0">
          <ol
            className="m-0 list-none p-0"
            aria-label="Governance setup steps"
            data-testid="governance-setup-step-track"
          >
            {model.steps.map((step, index) => (
              <GovernanceSetupGuideStepRow
                key={step.stepNumber}
                step={step}
                status={model.stepStatuses[index] ?? "not-started"}
                recommendedNext={progress.firstIncompleteIndex === index}
                isLast={index === model.steps.length - 1}
              />
            ))}
          </ol>

          <GovernanceSetupFoundationPanel
            indicators={model.foundationIndicators}
            stepStatuses={model.stepStatuses}
          />
        </div>

        <GovernanceSetupOutcomesPanel />
      </div>
    </div>
  );
}
