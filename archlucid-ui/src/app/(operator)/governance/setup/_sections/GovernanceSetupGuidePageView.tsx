import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/governance/GovernanceSetupConfigHubsVocabularyRail";
import {
  GOVERNANCE_SETUP_HREF,
  GOVERNANCE_SETUP_PAGE_SUBTITLE,
  GOVERNANCE_SETUP_PAGE_TITLE,
} from "@/lib/governance/governance-setup-route";
import {
  GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
  GOVERNANCE_SETUP_SOURCES,
  GOVERNANCE_SETUP_SOURCES_INTRO,
} from "@/lib/governance/governance-setup-evidence-copy";

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
        navHref={GOVERNANCE_SETUP_HREF}
        title={GOVERNANCE_SETUP_PAGE_TITLE}
        titleTestId="governance-setup-page-title"
        subtitle={GOVERNANCE_SETUP_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
      >
        <GovernanceSetupGuideProgressSummary summary={progress} />
      </OperatorPageHeader>

      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="setup" />

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
            steps={model.steps}
          />

          <EvidenceOrientationClaimAndSourcesStrip
            slug="governance-setup"
            claim={GOVERNANCE_SETUP_CLAIM_DISCIPLINE}
            sourcesIntro={GOVERNANCE_SETUP_SOURCES_INTRO}
            sources={GOVERNANCE_SETUP_SOURCES}
          />
        </div>

        <GovernanceSetupOutcomesPanel />
      </div>
    </div>
  );
}
