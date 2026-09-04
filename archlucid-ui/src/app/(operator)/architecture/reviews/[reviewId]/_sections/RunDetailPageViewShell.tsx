import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";

import { ArchitectureIntelligenceReviewToolStrip } from "@/components/ArchitectureIntelligenceReviewToolStrip";
import { GovernanceModePresentationGate } from "@/components/governance/GovernanceModePresentationGate";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";

import { RunDetailDeferredScopeNoticeClient } from "@/components/reviews/RunDetailDeferredScopeNoticeClient";
import {
  RunDetailBuyerModeFallbackBannerDeferred,
  RunDetailBuyerPilotConversionSectionDeferred,
  RunDetailCommitBlockingFindingsBannerDeferred,
  RunDetailCtoDemoReviewRouteGuardDeferred,
  RunDetailDemoMarketingChromeDeferred,
  RunDetailFirstWeekRouteGuidanceDeferred,
  RunDetailGovernanceAlertsDeferred,
  RunDetailGovernanceCtaDeferred,
  RunDetailOutcomeCardsDeferred,
  RunDetailReviewPackageDoThisNextResolvedDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailSectionNavDeferred,
  RunDetailStalledReviewGuidanceCalloutDeferred,
  RunDetailWorkspaceHeaderDeferred,
  HelpPageSituationRegistrarDeferred,
  ReviewGenerationCreatedNoticeDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailNextReviewFooterClient } from "./RunDetailNextReviewFooterClient";
import { RunDetailPageViewCommitted } from "./RunDetailPageViewCommitted";
import { RunDetailPageViewCreateHome } from "./RunDetailPageViewCreateHome";
import { RunDetailTabbedWorkspace } from "./RunDetailTabbedWorkspace";
import {
  RunDetailWorkspaceDisclosureProvider,
  RunDetailWorkspaceLayout,
} from "./RunDetailWorkspaceShell";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";
import { isReviewPipelineIncomplete } from "@/lib/run-detail-workspace-derive";
import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";

export type RunDetailPageViewChrome = {
  readonly sampleReviewPackageSummaryEl: React.JSX.Element | null;
  readonly governanceAlertsEl: React.JSX.Element;
  readonly createHomeActivityOutcomeCardsEl: React.JSX.Element;
  readonly sectionNavEl: React.JSX.Element;
  readonly governanceCtaEl: React.JSX.Element | null;
  readonly tabbedWorkspaceEl: React.JSX.Element;
  readonly reviewPackageDoThisNextEvidenceProps: {
    readonly evidenceCoverageLinkedCount: number;
    readonly evidenceCoverageTotalCount: number;
    readonly governanceDecisionRecorded: boolean;
    readonly pipelineDiagnosticContext: RunDetailPageModel["pipelineDiagnosticContext"];
    readonly lastFailureSummary: ReturnType<typeof resolveRunDetailLastFailureSummary>;
    readonly pipelineSummary: RunDetailPageModel["progressForPipelineUi"];
    readonly intakeDescription: string | null;
    readonly intakeSystemName: string | null;
    readonly realModeFellBackToSimulator: boolean;
  };
  readonly stalledReviewGuidanceEl: React.JSX.Element | null;
  readonly commitBlockingBannerEl: React.JSX.Element | null;
};

/** Builds deferred chunk elements and tab-workspace chrome for the run detail page shell. */
export function resolveRunDetailPageViewChrome(
  m: RunDetailPageModel,
  presentation: RunDetailPresentation,
): RunDetailPageViewChrome {
  const {
    evidenceCoverageSummary,
    findingCoverageSummary,
    showArchitectureCreatedHome,
    showGovernanceCta,
    showcasePolicyPackStrip,
    commitBlockedReason,
  } = presentation;

  const sampleReviewPackageSummaryEl =
    m.usedStaticDemoRun ? (
      <RunDetailSampleReviewPackageSummaryDeferred
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        artifactCount={m.artifacts.length}
        findingCount={m.findingCountDisplay}
      />
    ) : null;

  const governanceAlertsEl = (
    <GovernanceModePresentationGate>
      <>
        <RunDetailGovernanceAlertsDeferred
          run={m.resolvedDetail.run}
          hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
        />
        <RunDetailDeferredScopeNoticeClient />
      </>
    </GovernanceModePresentationGate>
  );

  const createHomeActivityOutcomeCardsEl = (
    <RunDetailOutcomeCardsDeferred
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      artifactCount={m.artifacts.length}
      findingCountDisplay={m.findingCountDisplay}
      warningCountDisplay={m.warningCountDisplay}
      hasGoldenManifest={Boolean(m.manifestId)}
      unresolvedIssueCountDisplay={m.manifestSummary?.unresolvedIssueCount ?? null}
      aggregateRiskPosture={m.explanationSummary?.riskPosture ?? null}
      governanceGateLabel={m.governanceGateLabel}
      authorityLifecyclePhase={m.resolvedDetail.authorityLifecyclePhase ?? null}
      showcasePolicyPackStrip={showcasePolicyPackStrip}
      degradedFindingCoverage={m.resolvedDetail.degradedFindingCoverage === true}
      failedEngineLabels={findingCoverageSummary?.failedEngineLabels ?? []}
      findingCoverageSummary={findingCoverageSummary}
      hidePromotedStatus
      pagePrimaryOwnedElsewhere
    />
  );

  const sectionNavEl = (
    <RunDetailSectionNavDeferred runId={m.resolvedDetail.run.runId} sections={m.runDetailNavSections} />
  );

  const governanceCtaEl = showGovernanceCta ? (
    <RunDetailGovernanceCtaDeferred runId={m.resolvedDetail.run.runId} demoted />
  ) : null;

  const tabbedWorkspaceEl = <RunDetailTabbedWorkspace model={m} presentation={presentation} />;

  const governanceDecisionRecorded =
    (m.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0;
  const reviewPackageDoThisNextEvidenceProps = {
    evidenceCoverageLinkedCount: evidenceCoverageSummary.linkedCount,
    evidenceCoverageTotalCount: evidenceCoverageSummary.totalCount,
    governanceDecisionRecorded,
    pipelineDiagnosticContext: m.pipelineDiagnosticContext,
    lastFailureSummary: resolveRunDetailLastFailureSummary(m.resolvedDetail),
    pipelineSummary: m.progressForPipelineUi,
    intakeDescription: m.resolvedDetail.run.description ?? m.progressForPipelineUi.description ?? null,
    intakeSystemName: m.progressForPipelineUi.displayName ?? null,
    realModeFellBackToSimulator: m.resolvedDetail.run.realModeFellBackToSimulator === true,
  };

  const stalledReviewGuidanceEl =
    !m.manifestId
      ? (() => {
          const legacyStatus = m.resolvedDetail.run.legacyRunStatus;
          const isDeadLettered = m.resolvedDetail.run.isDeadLettered === true;
          const stalled = detectStalledReview(
            m.resolvedDetail.run.createdUtc,
            m.resolvedDetail.run.completedUtc != null ||
              legacyStatus === "Completed" ||
              legacyStatus === "Failed",
            Date.now(),
            isDeadLettered,
          );

          return stalled.isStalled ? (
            <RunDetailStalledReviewGuidanceCalloutDeferred
              elapsedMinutes={stalled.elapsedMinutes}
              runId={m.resolvedDetail.run.runId}
              summary={m.progressForPipelineUi}
              diagnosticContext={m.pipelineDiagnosticContext}
            />
          ) : null;
        })()
      : null;

  const commitBlockingBannerEl =
    findingCoverageSummary?.hasCommitBlockingFailures === true && !showArchitectureCreatedHome ? (
      <RunDetailCommitBlockingFindingsBannerDeferred
        runId={m.resolvedDetail.run.runId}
        reason={commitBlockedReason}
      />
    ) : null;

  return {
    sampleReviewPackageSummaryEl,
    governanceAlertsEl,
    createHomeActivityOutcomeCardsEl,
    sectionNavEl,
    governanceCtaEl,
    tabbedWorkspaceEl,
    reviewPackageDoThisNextEvidenceProps,
    stalledReviewGuidanceEl,
    commitBlockingBannerEl,
  };
}

export type RunDetailPageViewShellProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
  readonly chrome: RunDetailPageViewChrome;
};

export function RunDetailPageViewShell(props: RunDetailPageViewShellProps): React.JSX.Element {
  const m = props.model;
  const presentation = props.presentation;
  const chrome = props.chrome;
  const {
    blockingApprovalCount,
    buyerGoldenPageReady,
    commitBlockedReason,
    finalizeAssumptionGateApplies,
    quickDecisionFindings,
    requestAssumptionTexts,
    reviewHeaderPresentation,
    reviewStatusSummary,
    showArchitectureCreatedHome,
    showDemoMarketingChrome,
    signedReviewRecordId,
    signedReviewRecordIdLabel,
    workspaceStatus,
    reviewOwnerLabel,
    templateLabel,
    finalizedAtLabel,
    packageVersionLabel,
    architectureEditHref,
    findingCoverageSummary,
  } = presentation;
  const reviewPipelineIncomplete = isReviewPipelineIncomplete(workspaceStatus);

  return (
    <div
      data-testid="review-detail-root"
      data-buyer-golden-ready={buyerGoldenPageReady ? "true" : "false"}
    >
      <div
        className={cn(
          OPERATOR_PAGE_CONTAINER.base,
          OPERATOR_PAGE_CONTAINER.variant.dashboard,
          OPERATOR_LAYOUT.sectionStack,
          "px-1 py-2 sm:px-0",
        )}
      >
        <RunDetailCtoDemoReviewRouteGuardDeferred runId={m.resolvedDetail.run.runId} />

        <HelpPageSituationRegistrarDeferred
          situation={blockingApprovalCount > 0 ? "review-approval-blocked" : null}
        />

        {!showArchitectureCreatedHome ? (
          <Suspense fallback={null}>
            <ReviewGenerationCreatedNoticeDeferred
              analysisInProgress={m.showProgressTracker}
              approvalBlocked={blockingApprovalCount > 0 || commitBlockedReason !== null}
              packageFinalized={Boolean(m.manifestId)}
            />
          </Suspense>
        ) : null}

        <RunDetailDemoMarketingChromeDeferred
          showMarketingBanner={showDemoMarketingChrome}
          showSampleBadge={m.usedStaticDemoRun && !showDemoMarketingChrome}
          emphasizeSampleData={m.usedStaticDemoRun}
          usedStaticDemoRun={m.usedStaticDemoRun}
          isSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
        />

        <RunDetailWorkspaceDisclosureProvider>
          <RunDetailWorkspaceLayout
            stickyActions={null}
            main={
              <>
                {showArchitectureCreatedHome ? (
                  <RunDetailPageViewCreateHome
                    model={m}
                    presentation={presentation}
                    createHomeActivityOutcomeCardsEl={chrome.createHomeActivityOutcomeCardsEl}
                    reviewPackageDoThisNextEvidenceProps={chrome.reviewPackageDoThisNextEvidenceProps}
                  />
                ) : (
                  <>
                    <RunDetailWorkspaceHeaderDeferred
                      runId={m.resolvedDetail.run.runId}
                      h1Title={reviewHeaderPresentation.h1Title}
                      eyebrowLabel={reviewHeaderPresentation.eyebrowLabel}
                      reviewIdentifierLabel={reviewHeaderPresentation.reviewIdentifierLabel}
                      signedReviewRecordId={signedReviewRecordId}
                      signedReviewRecordIdLabel={signedReviewRecordIdLabel}
                      workspaceStatus={workspaceStatus}
                      reviewOwner={reviewOwnerLabel}
                      templateLabel={templateLabel}
                      finalizedAtLabel={finalizedAtLabel}
                      packageVersionLabel={packageVersionLabel}
                    />

                    <RunDetailReviewPackageDoThisNextResolvedDeferred
                      runId={m.resolvedDetail.run.runId}
                      manifestId={m.manifestId}
                      hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                      blockingFindingCount={blockingApprovalCount}
                      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                      operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
                      manifestStatus={m.manifestSummary?.status ?? null}
                      runCompleted={m.resolvedDetail.run.completedUtc != null}
                      nextAction={reviewStatusSummary.nextAction}
                      showProgressTracker={m.showProgressTracker}
                      legacyRunStatus={m.resolvedDetail.run.legacyRunStatus ?? null}
                      isDeadLettered={m.resolvedDetail.run.isDeadLettered === true}
                      openClarificationGapCount={0}
                      correctionHref={architectureEditHref}
                      useCreateHomeWorkspaceTabs={false}
                      hasGoldenManifest={Boolean(m.manifestId)}
                      commitBlockedReason={commitBlockedReason}
                      finalizeAssumptionGateApplies={finalizeAssumptionGateApplies}
                      quickDecisionFindings={quickDecisionFindings}
                      requestAssumptionTexts={requestAssumptionTexts}
                      transparencyTrail={
                        m.manifestSummaryForUi?.feasibilityVerdict?.transparencyTrail ??
                        m.manifestSummary?.feasibilityVerdict?.transparencyTrail ??
                        null
                      }
                      feasibilityVerdict={
                        m.manifestSummaryForUi?.feasibilityVerdict ??
                        m.manifestSummary?.feasibilityVerdict ??
                        null
                      }
                      graphSnapshot={m.resolvedDetail.graphSnapshot}
                      analysisStagesComplete={analysisStagesCompleteOnSummary(m.progressForPipelineUi)}
                      {...chrome.reviewPackageDoThisNextEvidenceProps}
                    />

                    {chrome.tabbedWorkspaceEl}
                  </>
                )}

                {chrome.stalledReviewGuidanceEl}
                {chrome.commitBlockingBannerEl}
              </>
            }
            rail={null}
          />
        </RunDetailWorkspaceDisclosureProvider>

        {!reviewPipelineIncomplete ? (
          <OperatorRelatedSurfacesDisclosure testId="review-detail-related-surfaces-disclosure">
            <ArchitectureIntelligenceReviewToolStrip
              runId={m.resolvedDetail.run.runId}
              currentSurfaceId="review-workspace"
            />
            <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="review-detail" />
          </OperatorRelatedSurfacesDisclosure>
        ) : null}

        {showArchitectureCreatedHome ? (
          <RunDetailPageViewCommitted
            model={m}
            presentation={presentation}
            governanceCtaEl={chrome.governanceCtaEl}
            sectionNavEl={chrome.sectionNavEl}
            sampleReviewPackageSummaryEl={chrome.sampleReviewPackageSummaryEl}
          />
        ) : null}

        {blockingApprovalCount === 0 && !reviewPipelineIncomplete ? (
          <RunDetailFirstWeekRouteGuidanceDeferred
            variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
            pagePrimaryOwnedElsewhere
          />
        ) : null}

        {chrome.governanceAlertsEl}

        {m.buyerPolishedArtifactTable ? (
          <RunDetailBuyerModeFallbackBannerDeferred
            realModeFellBackToSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
          />
        ) : null}

        <RunDetailBuyerPilotConversionSectionDeferred buyerPolishedArtifactTable={m.buyerPolishedArtifactTable} />

        {!reviewPipelineIncomplete ? (
          <RunDetailNextReviewFooterClient runId={m.routeRunId} />
        ) : null}
      </div>
    </div>
  );
}
