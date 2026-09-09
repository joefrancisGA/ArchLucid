"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/governance/GovernanceSetupConfigHubsVocabularyRail";
import {
  GOVERNANCE_SETUP_HREF,
  GOVERNANCE_SETUP_PAGE_TITLE,
} from "@/lib/governance/governance-setup-route";
import {
  GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
  GOVERNANCE_SETUP_SOURCES,
  GOVERNANCE_SETUP_SOURCES_INTRO,
} from "@/lib/governance/governance-setup-evidence-copy";
import {
  GOVERNANCE_SETUP_BUYER_START_HERE_HELPER,
  GOVERNANCE_SETUP_LOAD_ERROR,
  GOVERNANCE_SETUP_PAGE_LEAD,
  GOVERNANCE_SETUP_PRIMARY_CONTENT_ID,
  GOVERNANCE_SETUP_SKIP_LINK_LABEL,
} from "@/lib/governance-setup-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceSetupFoundationPanel } from "./GovernanceSetupFoundationPanel";
import { GovernanceSetupGuideProgressSummary } from "./GovernanceSetupGuideProgressSummary";
import { GovernanceSetupGuideStepRow } from "./GovernanceSetupGuideStepRow";
import { GovernanceSetupOutcomesPanel } from "./GovernanceSetupOutcomesPanel";
import { GovernanceSetupBuyerChrome } from "./GovernanceSetupBuyerChrome";
import { governanceSetupPageSubtitle } from "./governance-setup-page-copy";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { summarizeGovernanceSetupProgress } from "./governance-setup-guide-steps";
import type { GovernanceSetupGuideViewModel } from "./governance-setup-guide-types";
import { cn } from "@/lib/utils";

type GovernanceSetupGuidePageViewProps = {
  readonly model: GovernanceSetupGuideViewModel;
};

export function GovernanceSetupGuidePageView({ model }: GovernanceSetupGuidePageViewProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const progress = summarizeGovernanceSetupProgress(model.stepStatuses, model.steps);
  const pageSubtitle = governanceSetupPageSubtitle(buyerPolishedShell);

  const setupWorkspace = (
    <>
      {model.bundleLoadFailed === true ? (
        <OperatorSectionLoadFailure
          message={
            model.blockedReason ??
            "Could not load governance setup status. Your policy and alert configuration may still be saved — retry to refresh progress."
            (buyerPolishedShell
              ? GOVERNANCE_SETUP_LOAD_ERROR
              : "Could not load approval setup status. Your policy and alert configuration may still be saved — retry to refresh progress.")
          }
          onRetry={() => window.location.reload()}
          retryLabel={buyerPolishedShell ? "Try again" : "Reload page"}
          testId="governance-setup-bundle-load-failure"
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,18rem)] lg:items-start">
        <div className="space-y-5 min-w-0">
          <ol
            className="m-0 list-none p-0"
            aria-label="Approval setup steps"
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

          {!buyerPolishedShell ? (
            <EvidenceOrientationClaimAndSourcesStrip
              slug="governance-setup"
              claim={GOVERNANCE_SETUP_CLAIM_DISCIPLINE}
              sourcesIntro={GOVERNANCE_SETUP_SOURCES_INTRO}
              sources={GOVERNANCE_SETUP_SOURCES}
              claimElement="aside"
              sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
            />
          ) : null}
        </div>

        <GovernanceSetupOutcomesPanel />
      </div>

      {buyerPolishedShell ? <GovernanceSetupBuyerChrome /> : null}
    </>
  );

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}
      data-testid="governance-setup-guide-page"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_SETUP_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_SETUP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_SETUP_HREF}
        title={GOVERNANCE_SETUP_PAGE_TITLE}
        titleTestId="governance-setup-page-title"
        subtitle={pageSubtitle}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_SETUP_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="governance-setup-claim-discipline"
        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
      >
        <GovernanceSetupGuideProgressSummary summary={progress} />
      </OperatorPageHeader>

      {!buyerPolishedShell ? (
        <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="setup" />
      ) : null}

      {buyerPolishedShell ? (
        <div
          id={GOVERNANCE_SETUP_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
          data-testid="governance-setup-primary-content"
        >
          <div
            className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
            data-testid="governance-setup-first-viewport"
          >
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="governance-setup-intro"
            >
              {GOVERNANCE_SETUP_PAGE_LEAD}
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-setup-buyer-start-here-helper"
            >
              {GOVERNANCE_SETUP_BUYER_START_HERE_HELPER}
            </p>
          </div>
          {setupWorkspace}
        </div>
      ) : (
        setupWorkspace
      )}
    </OperatorPageContainer>
  );
}
