import { Suspense } from "react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceModePresentationGate } from "@/components/governance/GovernanceModePresentationGate";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";

import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import { RunDetailActivityTabSectionNav } from "@/components/runs/RunDetailActivityTabSectionNav";

import {
  RunDetailWorkspaceDisclosureControls,
  RunDetailWorkspaceDisclosureProvider,
  RunDetailWorkspaceLayout,
} from "./RunDetailWorkspaceShell";
import { RunDetailDeferredScopeNoticeClient } from "@/components/reviews/RunDetailDeferredScopeNoticeClient";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import {
  RunDetailBuyerModeFallbackBannerDeferred,
  RunDetailBuyerPilotConversionSectionDeferred,
  RunDetailCaptureEvidenceSectionDeferred,
  RunDetailDemoMarketingChromeDeferred,
  RunDetailEvidenceTabPanelDeferred,
  RunDetailExecutiveBottomLineDeferred,
  RunDetailExecutiveSummaryCtaCardDeferred,
  RunDetailGovernanceCtaDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailManifestSummaryAlertsDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailReviewPackageSectionDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailRunActionsSectionDeferred,
  RunDetailSectionNavDeferred,
  BeforeAfterDeltaPanelDeferred,
  RecurrenceSchedulePostCommitCardDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailActivitySourcesPanelDeferred,
  RunDetailCreateHomeEvidencePanelDeferred,
  RunDetailReviewPackageDoThisNextResolvedDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
  RunDetailPackageChangesSinceFinalizeDeferred,
  RunDetailWorkspaceHeaderDeferred,
  RunDetailWorkspaceBlockingBannerDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
  RunDetailArchitectureCreateWorkItemSectionDeferred,
  RunDetailArchitectureCreatedWorkspaceDeferred,
  RunDetailArchitectureSponsorSharingPanelDeferred,
  RunDetailArtifactsExportsSectionDeferred,
  RunDetailCommitBlockingFindingsBannerDeferred,
  RunDetailCompareToBaselineCta,
  RunDetailCtoDemoReviewRouteGuardDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailFirstWeekRouteGuidanceDeferred,
  RunDetailColdOpenOrientationDeferred,
  RunDetailGenerateAdrFromRunModal,
  RunDetailGovernanceAlertsDeferred,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailOutcomeCardsDeferred,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailProgressTrackerDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailStalledReviewGuidanceCalloutDeferred,
  RunDetailTechnologyBaselineSection,
  RunDetailTrustEvidenceCardSectionDeferred,
  RunDetailWhatIfBranchCompareBannerDeferred,
  ReviewDetailWorkspaceDeferred,
  RunDetailOverviewPanelClientDeferred,
  HelpPageSituationRegistrarDeferred,
  ReviewGenerationCreatedNoticeDeferred,
  RunDetailBelowFoldSectionsDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import { buildRunDetailPresentation } from "./run-detail-page-presentation";
import {
  RunDetailArchitectureGraphIsland,
  RunDetailPostCommitHabitIsland,
} from "./RunDetailTabbedDeferredIslands";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailExplanationSkeleton,
  RunDetailMidDeferredSkeleton,
} from "./RunDetailDeferredSkeleton";
import { RunDetailDecisionDeltaDeferred } from "./RunDetailDecisionDeltaDeferred";
import { RunDetailDecisionDeltaSkeleton } from "./RunDetailDecisionDeltaSkeleton";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import type { RunDetailPageModel } from "./run-detail-page-model";

/** Server component: renders the main run detail chrome from a preloaded `RunDetailPageModel`. */
export async function RunDetailPageView(props: {
  readonly model: RunDetailPageModel;
  readonly fromArchitectureCreation?: boolean;
}): Promise<React.JSX.Element> {
  const m = props.model;
  const {
    architectureCreatedBaseline,
    architectureCreatedHomeModel,
    architectureEditHref,
    architectureSummaryTitle,
    blockingApprovalCount,
    buyerFinalizedPackage,
    buyerGoldenPageReady,
    commitBlockedReason,
    createHomeActivityProvenanceAsOfLabel,
    createHomeActivityStatusLine,
    createHomeAnalysisStagesComplete,
    createHomePreFinalizeReadyToFinalize,
    deferredContext,
    evidenceCoverageSummary,
    evidenceInventoryCount,
    evidenceInventoryItems,
    evidenceReviewDateLabel,
    executiveBottomLineContent,
    finalizedAtLabel,
    findingCoverageSummary,
    findingsSummaryLine,
    findingsTriageVisibleCount,
    governanceOutcomeLine,
    hasSubmittedArchitecture,
    materialSeverityLine,
    packageVersionLabel,
    pendingDecisionCount,
    primaryConcernFindingId,
    primaryConcernLabel,
    quickDecisionFindings,
    recommendedActions,
    reviewDisplayTitle,
    reviewHeaderPresentation,
    reviewOwnerLabel,
    reviewPolicyPackCallout,
    reviewStatusSummary,
    severityCounts,
    showArchitectureCreatedHome,
    showcasePolicyPackStrip,
    showDemoMarketingChrome,
    showGovernanceCta,
    showGovernanceCtaCard,
    submittedArchitectureText,
    templateLabel,
    workspaceStatus,
  } = await buildRunDetailPresentation(m, props.fromArchitectureCreation === true);

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

  const outcomeCardsEl = (
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
      showcasePolicyPackStrip={showcasePolicyPackStrip}
      degradedFindingCoverage={m.resolvedDetail.degradedFindingCoverage === true}
      failedEngineLabels={findingCoverageSummary?.failedEngineLabels ?? []}
      findingCoverageSummary={findingCoverageSummary}
    />
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
      showcasePolicyPackStrip={showcasePolicyPackStrip}
      degradedFindingCoverage={m.resolvedDetail.degradedFindingCoverage === true}
      failedEngineLabels={findingCoverageSummary?.failedEngineLabels ?? []}
      findingCoverageSummary={findingCoverageSummary}
      hidePromotedStatus
    />
  );

  const artifactsExportsSectionEl =
    m.manifestId ? (
      <RunDetailArtifactsExportsSectionDeferred
        manifestId={m.manifestId}
        runId={m.resolvedDetail.run.runId}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        artifacts={m.artifacts}
        artifactsFailure={m.artifactsFailure}
        artifactsMalformed={m.artifactsMalformed}
        goldenManifestJsonForExport={m.goldenManifestJsonForExport}
        manifestSummaryForUi={m.manifestSummaryForUi}
        manifestSummary={m.manifestSummary}
        trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
        usedStaticDemoRun={m.usedStaticDemoRun}
        requestId={
          m.resolvedDetail.run.architectureRequestId ??
          (m.resolvedDetail.run as { requestId?: string }).requestId
        }
        deliverablesDefaultOpen={false}
      />
    ) : null;

  const sectionNavEl = (
    <RunDetailSectionNavDeferred runId={m.resolvedDetail.run.runId} sections={m.runDetailNavSections} />
  );

  const governanceCtaEl = showGovernanceCta ? (
    <RunDetailGovernanceCtaDeferred runId={m.resolvedDetail.run.runId} demoted />
  ) : null;

  const evidenceTabPanelEl = (
    <RunDetailEvidenceTabPanelDeferred
      packageName={reviewDisplayTitle}
      reviewDateLabel={evidenceReviewDateLabel}
      evidenceItemCount={evidenceInventoryCount}
      deliverableCount={m.artifacts.length}
      evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
      linkedFindingCount={evidenceCoverageSummary.linkedCount}
      openFindingCount={evidenceCoverageSummary.totalCount}
      items={evidenceInventoryItems}
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      buyerPolished={m.buyerPolishedArtifactTable ?? false}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
      faithfulnessWarning={m.explanationSummary?.faithfulnessWarning ?? null}
      artifactsExportsSection={artifactsExportsSectionEl}
      blockingFindingId={primaryConcernFindingId}
      blockingFindingTitle={primaryConcernLabel}
      approvalBlocked={blockingApprovalCount > 0}
    />
  );
  const executiveBottomLineEl =
    blockingApprovalCount === 0 ? (
      <RunDetailExecutiveBottomLineDeferred content={executiveBottomLineContent} />
    ) : null;
  const explanationDeferredEl = (
    <RunDetailExplanationDeferred
      runId={m.routeRunId}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      resolvedDetail={m.resolvedDetail}
      explanationSummary={m.explanationSummary}
      explanationFailure={m.explanationFailure}
      findingCountDisplay={m.findingCountDisplay}
      warningCountDisplay={m.warningCountDisplay}
      goldenManifestJsonForExport={m.goldenManifestJsonForExport}
      manifestRuleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
      manifestRuleSetVersion={m.manifestSummaryForUi?.ruleSetVersion ?? null}
    />
  );
  const governanceDecisionSectionEl = (
    <RunDetailGovernanceDecisionSectionDeferred
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
      operatorGovernanceDecisionRationale={m.resolvedDetail.run.operatorGovernanceDecisionRationale}
      operatorGovernanceDecisionUtc={m.resolvedDetail.run.operatorGovernanceDecisionUtc}
      operatorGovernanceDecisionByUserId={m.resolvedDetail.run.operatorGovernanceDecisionByUserId}
      manifestStatus={m.manifestSummary?.status ?? null}
      governanceGateLabel={m.governanceGateLabel}
      blockingFindingCount={blockingApprovalCount}
      hasGovernanceWarnings={m.resolvedDetail.run.hasGovernanceWarnings === true}
    />
  );
  const submittedArchitectureTabEl = (
    <RunDetailSubmittedArchitectureSectionDeferred
      architectureText={submittedArchitectureText}
      canEditSource={!m.manifestId}
      editHref={architectureEditHref}
      useStructuredPresentation
      runId={m.resolvedDetail.run.runId}
      helperText="Source material submitted for this review — distinct from ArchLucid analysis in other tabs."
    />
  );
  const architectureTabPanelEl = (
    <div className="space-y-4">
      {submittedArchitectureTabEl}
      <RunDetailTechnologyBaselineSection
        runId={m.resolvedDetail.run.runId}
        manifestFinalized={Boolean(m.manifestId)}
        buyerPolished={m.buyerPolishedArtifactTable ?? false}
        usedStaticDemoRun={m.usedStaticDemoRun}
        warningCountDisplay={m.warningCountDisplay ?? 0}
      />
      <RunDetailArchitectureGraphIsland model={m} context={deferredContext} />
    </div>
  );
  const tabbedWorkspaceEl = !showArchitectureCreatedHome ? (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <ReviewDetailWorkspaceDeferred
        runId={m.resolvedDetail.run.runId}
        tabLifecycle={{
          manifestId: m.manifestId,
          showProgressTracker: m.showProgressTracker,
          runCompleted: m.resolvedDetail.run.completedUtc != null,
        }}
        tabActivityAt={deriveReviewDetailTabActivityAt({
          run: m.resolvedDetail.run,
          manifestSummary: m.manifestSummary,
          manifestId: m.manifestId,
          findings: quickDecisionFindings,
          operatorGovernanceDecisionUtc: m.resolvedDetail.run.operatorGovernanceDecisionUtc,
        })}
        tabCounts={{
          findings: (m.findingCountDisplay ?? 0) > 0 ? m.findingCountDisplay : null,
          evidence: evidenceInventoryCount > 0 ? evidenceInventoryCount : null,
          decisionsRemediation: pendingDecisionCount > 0 ? pendingDecisionCount : null,
        }}
        panels={{
          overview: (
            <div className="space-y-4">
              <RunDetailOverviewPanelClientDeferred
                runId={m.resolvedDetail.run.runId}
                architectureTitle={architectureSummaryTitle}
                architectureText={submittedArchitectureText}
                evidenceCount={evidenceInventoryCount}
                hasSubmittedArchitecture={hasSubmittedArchitecture}
                userAssertions={null}
                recommendedActions={recommendedActions}
                criticalCount={severityCounts.critical}
                highCount={severityCounts.high}
                proofStatusSlot={<RunDetailFirstScreenProofStatusClient runId={m.resolvedDetail.run.runId} />}
              />
              <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
                <div className="mt-3">{outcomeCardsEl}</div>
              </details>
              <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                <RunDetailMidDeferredSections context={deferredContext} />
              </Suspense>
              {buyerFinalizedPackage ? null : (
                <RunDetailExecutiveSummaryCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
              )}
            </div>
          ),
          findings: (
            <>
              {m.explanationSummary !== null ? (
                <RunDetailExplanationConfidenceBannerDeferred summary={m.explanationSummary} />
              ) : null}
              {explanationDeferredEl}
              <RunDetailHolisticCriticPanelDeferred
                runId={m.resolvedDetail.run.runId}
                hasGoldenManifest={Boolean(m.manifestId)}
              />
            </>
          ),
          evidence: evidenceTabPanelEl,
          policies: (
            <div className="space-y-4">
              {reviewPolicyPackCallout !== null ? (
                <RunDetailPolicyPackImpactCalloutDeferred
                  ruleSetId={reviewPolicyPackCallout.ruleSetId}
                  ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
                  runId={m.resolvedDetail.run.runId}
                  totalFindingCount={m.findingCountDisplay}
                />
              ) : null}
              {m.manifestId && m.manifestSummaryForUi ? (
                <RunDetailManifestSummarySectionDeferred
                  manifestSummary={m.manifestSummaryForUi}
                  buyerPolishedShell={m.buyerPolishedArtifactTable}
                  runExecution={{
                    realModeFellBackToSimulator: m.resolvedDetail.run.realModeFellBackToSimulator,
                    pilotAoaiDeploymentSnapshot: m.resolvedDetail.run.pilotAoaiDeploymentSnapshot ?? null,
                  }}
                />
              ) : null}
              <RunDetailManifestSummaryAlertsDeferred
                manifestSummaryFailure={m.manifestSummaryFailure}
                manifestSummaryMalformed={m.manifestSummaryMalformed}
              />
            </div>
          ),
          decisionsRemediation: (
            <div className="space-y-4">
              {governanceDecisionSectionEl}
              {m.buyerPolishedArtifactTable && m.manifestId ? (
                <Suspense fallback={<RunDetailDecisionDeltaSkeleton />}>
                  <RunDetailDecisionDeltaDeferred
                    runId={m.routeRunId}
                    resolvedDetail={m.resolvedDetail}
                    explanationSummary={m.explanationSummary}
                    isCommitted
                  />
                </Suspense>
              ) : null}
              {buyerFinalizedPackage ? null : showGovernanceCtaCard ? governanceCtaEl : null}
              {!m.buyerPolishedArtifactTable ? (
                <Suspense
                  fallback={
                    <div
                      className="h-12 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                      role="status"
                      aria-label="Loading comparison banner"
                    />
                  }
                >
                  <RunDetailWhatIfBranchCompareBannerDeferred
                    currentRunId={m.resolvedDetail.run.runId}
                    hasCurrentManifest={Boolean(m.manifestId)}
                  />
                </Suspense>
              ) : null}
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
              ) : null}
              {m.manifestId && !m.buyerPolishedArtifactTable ? (
                <BeforeAfterDeltaPanelDeferred variant="inline" runId={m.routeRunId} />
              ) : null}
            </div>
          ),
          reviewPackage: (
            <div className="space-y-4">
              <RunDetailReviewPackageSectionDeferred
                manifestId={m.manifestId}
                runId={m.resolvedDetail.run.runId}
                artifactCount={m.artifacts.length}
                findingCount={m.findingCountDisplay}
                showExportActions={Boolean(m.manifestId) && !m.usedStaticDemoRun}
              />
              {m.manifestId ? (
                <RunDetailReviewPackageShareRowDeferred
                  runId={m.resolvedDetail.run.runId}
                  manifestId={m.manifestId}
                  completedUtc={m.resolvedDetail.run.completedUtc}
                />
              ) : null}
              {m.manifestId ? (
                <RunDetailPackageChangesSinceFinalizeDeferred
                  runId={m.routeRunId}
                  finalizeUtc={
                    m.manifestSummaryForUi?.createdUtc?.trim() ||
                    m.manifestSummary?.createdUtc?.trim() ||
                    null
                  }
                />
              ) : null}
              {showDemoMarketingChrome ? sampleReviewPackageSummaryEl : null}
              {!m.buyerPolishedArtifactTable ? (
                <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                  <RunDetailGenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
                </div>
              ) : null}
              {resolveRunDetailSponsorBriefingSection(m)}
              {m.manifestId ? (
                <RunDetailPostCommitHabitIsland model={m} context={deferredContext} />
              ) : null}
              {m.manifestId ? (
                <RecurrenceSchedulePostCommitCardDeferred
                  runId={m.routeRunId}
                  hasStickinessPrompt={Boolean(m.manifestId)}
                />
              ) : null}
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailRunActionsSectionDeferred
                  runId={m.resolvedDetail.run.runId}
                  systemName={m.resolvedDetail.run.description?.trim() || m.resolvedDetail.run.runId}
                  manifestId={m.manifestId}
                  hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                  operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision ?? null}
                />
              ) : null}
            </div>
          ),
          architecture: architectureTabPanelEl,
          activity: (
            <div className="space-y-4">
              <RunDetailActivityTabSectionNav hasManifestId={Boolean(m.manifestId)} />
              {!m.manifestId && m.showProgressTracker ? (
                <div id="pipeline-timeline" className="scroll-mt-24">
                  <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
                </div>
              ) : null}
              {m.showProgressTracker && m.manifestId ? (
                <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
              ) : null}
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                <Link
                  className={OPERATOR_LINK.nav}
                  href={`/architecture/reviews/${encodeURIComponent(m.resolvedDetail.run.runId)}/provenance`}
                  data-testid="run-detail-provenance-link"
                >
                  Full provenance view
                </Link>
              </p>
              <RunDetailLastFailureCardDeferred
                summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
                legacyRunStatus={
                  (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
                }
              />
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailOperatorTechnicalForensicsPanelDeferred
                  agentExecutionLlmCostEstimate={m.resolvedDetail.agentExecutionLlmCostEstimate}
                  results={m.resolvedDetail.results}
                  agentExecutionOutcomes={m.resolvedDetail.agentExecutionOutcomes}
                  retrievalGroundingSummary={m.resolvedDetail.retrievalGroundingSummary}
                  run={m.resolvedDetail.run}
                  runDetailTraceId={m.runDetailTraceId}
                />
              ) : null}
              <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
                <RunDetailBelowFoldSectionsDeferred
                  model={m}
                  context={deferredContext}
                  renderedInsideTabbedWorkspace
                />
              </Suspense>
            </div>
          ),
        }}
      />
    </Suspense>
  ) : null;

  const runDetailBody = (
    <div
      className={cn(
        OPERATOR_PAGE_CONTAINER.base,
        OPERATOR_PAGE_CONTAINER.variant.dashboard,
        OPERATOR_LAYOUT.sectionStack,
        "px-1 py-2 sm:px-0",
      )}
    >
      <RunDetailCtoDemoReviewRouteGuardDeferred runId={m.resolvedDetail.run.runId} />

      <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="review-detail" />

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
                <>
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
                    openClarificationGapCount={architectureCreatedHomeModel?.clarificationGaps.length ?? 0}
                    correctionHref={architectureEditHref}
                    useCreateHomeWorkspaceTabs
                    hasGoldenManifest={Boolean(m.manifestId)}
                    commitBlockedReason={commitBlockedReason}
                  />
                  <RunDetailWorkspaceDisclosureControls />
                  <Suspense fallback={<RunDetailExplanationSkeleton />}>
                  <RunDetailArchitectureCreatedWorkspaceDeferred
                    baseline={architectureCreatedBaseline}
                    architectureSourceText={submittedArchitectureText ?? ""}
                    canEditDiagram={!m.manifestId}
                    findings={quickDecisionFindings}
                    findingsTriageVisibleCount={findingsTriageVisibleCount}
                    correctionHref={architectureEditHref}
                    panels={{
                      findings: (
                        <RunDetailExplanationDeferred
                          runId={m.routeRunId}
                          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                          resolvedDetail={m.resolvedDetail}
                          explanationSummary={m.explanationSummary}
                          explanationFailure={m.explanationFailure}
                          findingCountDisplay={m.findingCountDisplay}
                          warningCountDisplay={m.warningCountDisplay}
                          goldenManifestJsonForExport={m.goldenManifestJsonForExport}
                          manifestRuleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
                          manifestRuleSetVersion={m.manifestSummaryForUi?.ruleSetVersion ?? null}
                          packageCommitted={Boolean(m.manifestId)}
                          analysisStagesComplete={createHomeAnalysisStagesComplete}
                          triageVisibleCount={findingsTriageVisibleCount}
                          providerNeutralWorkItems={Boolean(m.manifestId)}
                          architectureWorkItemContext={
                            m.manifestId
                              ? {
                                  architectureName: architectureCreatedBaseline.architectureName,
                                  architectureOverview: architectureCreatedBaseline.architectureOverview,
                                  ownerLabel: architectureCreatedBaseline.ownerLabel,
                                }
                              : null
                          }
                        />
                      ),
                      evidence: (
                        <RunDetailCreateHomeEvidencePanelDeferred
                          packageName={reviewDisplayTitle}
                          reviewDateLabel={evidenceReviewDateLabel}
                          deliverableCount={m.artifacts.length}
                          evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
                          linkedFindingCount={evidenceCoverageSummary.linkedCount}
                          openFindingCount={evidenceCoverageSummary.totalCount}
                          items={evidenceInventoryItems}
                          runId={m.resolvedDetail.run.runId}
                          buyerPolished={m.buyerPolishedArtifactTable ?? false}
                        />
                      ),
                      governance: (
                        <>
                          <RunDetailGovernanceDecisionSectionDeferred
                            runId={m.resolvedDetail.run.runId}
                            manifestId={m.manifestId}
                            buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                            operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
                            operatorGovernanceDecisionRationale={m.resolvedDetail.run.operatorGovernanceDecisionRationale}
                            operatorGovernanceDecisionUtc={m.resolvedDetail.run.operatorGovernanceDecisionUtc}
                            operatorGovernanceDecisionByUserId={m.resolvedDetail.run.operatorGovernanceDecisionByUserId}
                            manifestStatus={m.manifestSummary?.status ?? null}
                            governanceGateLabel={m.governanceGateLabel}
                            blockingFindingCount={blockingApprovalCount}
                            hasGovernanceWarnings={m.resolvedDetail.run.hasGovernanceWarnings === true}
                          />
                          {m.manifestId ? (
                            <>
                              <RunDetailArchitectureCreateWorkItemSectionDeferred
                                runId={m.resolvedDetail.run.runId}
                                architectureName={architectureCreatedBaseline.architectureName}
                                architectureOverview={architectureCreatedBaseline.architectureOverview}
                                ownerLabel={architectureCreatedBaseline.ownerLabel}
                                findings={quickDecisionFindings}
                              />
                              <RunDetailArchitectureSponsorSharingPanelDeferred
                                runId={m.resolvedDetail.run.runId}
                                architecture={architectureCreatedBaseline}
                                architectureSourceText={submittedArchitectureText ?? ""}
                                findings={quickDecisionFindings}
                              />
                            </>
                          ) : null}
                        </>
                      ),
                      activity: (
                        <div className="space-y-4" data-testid="run-detail-create-home-activity">
                          <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                            Assessment progress
                          </h2>
                          <p
                            className={cn(
                              "m-0 rounded-md border border-neutral-200 bg-al-surface-raised font-medium leading-snug dark:border-neutral-800 p-3",
                              OPERATOR_TYPOGRAPHY.body,
                            )}
                            role="status"
                            data-testid="run-detail-activity-status-headline"
                          >
                            {createHomeActivityStatusLine}
                          </p>
                          {!m.manifestId ? (
                            <div id="architecture-assessment-progress" className="scroll-mt-24">
                              <RunDetailProgressTrackerDeferred
                                runId={m.routeRunId}
                                initialSummary={m.progressForPipelineUi}
                                preFinalizeReadyToFinalize={createHomePreFinalizeReadyToFinalize}
                                buyerAssessmentCopy
                              />
                            </div>
                          ) : null}
                          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                            <Link
                              className={OPERATOR_LINK.nav}
                              href={`/architecture/reviews/${encodeURIComponent(m.resolvedDetail.run.runId)}/provenance`}
                              data-testid="run-detail-provenance-link"
                            >
                              Full provenance view
                            </Link>
                            {createHomeActivityProvenanceAsOfLabel !== "—" ? (
                              <span className="text-al-text-secondary"> (as of {createHomeActivityProvenanceAsOfLabel})</span>
                            ) : null}
                          </p>
                          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                            <summary className="cursor-pointer font-semibold">Outcome metrics and taxonomy</summary>
                            <div className="mt-3">{createHomeActivityOutcomeCardsEl}</div>
                          </details>
                          <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                            <RunDetailMidDeferredSections context={deferredContext} includeSavingsSummary={false} />
                          </Suspense>
                          <RunDetailActivitySourcesPanelDeferred />
                        </div>
                      ),
                      submittedArchitecture: (
                        <RunDetailSubmittedArchitectureSectionDeferred
                          architectureText={submittedArchitectureText}
                          canEditSource={!m.manifestId}
                          editHref={architectureEditHref}
                          useStructuredPresentation={false}
                          runId={m.resolvedDetail.run.runId}
                          sectionTitle="Submitted brief"
                        />
                      ),
                    }}
                  />
                  </Suspense>
                </>
              ) : (
                <>
                  <RunDetailWorkspaceHeaderDeferred
                    runId={m.resolvedDetail.run.runId}
                    h1Title={reviewHeaderPresentation.h1Title}
                    eyebrowLabel={reviewHeaderPresentation.eyebrowLabel}
                    reviewIdentifierLabel={reviewHeaderPresentation.reviewIdentifierLabel}
                    workspaceStatus={workspaceStatus}
                    reviewOwner={reviewOwnerLabel}
                    templateLabel={templateLabel}
                    finalizedAtLabel={finalizedAtLabel}
                    packageVersionLabel={packageVersionLabel}
                  />

                  <RunDetailColdOpenOrientationDeferred
                    runId={m.resolvedDetail.run.runId}
                    packageTitle={reviewDisplayTitle}
                    packageOwnerLabel={reviewOwnerLabel}
                    workspaceStatus={workspaceStatus}
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
                    openClarificationGapCount={0}
                    correctionHref={architectureEditHref}
                    useCreateHomeWorkspaceTabs={false}
                    hasGoldenManifest={Boolean(m.manifestId)}
                    commitBlockedReason={commitBlockedReason}
                  />

                  {blockingApprovalCount > 0 ? (
                    <RunDetailWorkspaceBlockingBannerDeferred
                      blockingCount={blockingApprovalCount}
                    />
                  ) : null}

                  <RunDetailWorkspaceSummaryStripDeferred
                    outcomeHeading={m.manifestId ? "Governance decision" : "Review posture"}
                    reviewOutcome={m.manifestId ? governanceOutcomeLine : reviewStatusSummary.reviewOutcome}
                    highestUnresolvedSeverity={reviewStatusSummary.highestUnresolvedSeverity}
                    findingsSummaryLine={findingsSummaryLine}
                    evidenceCoverageLine={evidenceCoverageSummary.summaryLine}
                    primaryConcern={reviewStatusSummary.primaryConcern}
                    materialSeverityLine={materialSeverityLine}
                  />

                  {m.manifestId ? (
                    <RunDetailReviewPackageSponsorHandoffGateDeferred
                      runId={m.resolvedDetail.run.runId}
                      manifestId={m.manifestId}
                      hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                      blockingFindingCount={blockingApprovalCount}
                      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                      operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
                      manifestStatus={m.manifestSummary?.status ?? null}
                      runCompleted={m.resolvedDetail.run.completedUtc != null}
                      nextAction={reviewStatusSummary.nextAction}
                      goldenManifestJsonForExport={m.goldenManifestJsonForExport}
                      manifestSummary={m.manifestSummaryForUi ?? m.manifestSummary}
                      trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
                      usedStaticDemoRun={m.usedStaticDemoRun}
                      showExtendedSponsorBriefing={m.showPilotScorecardPackageCta}
                    />
                  ) : null}
                </>
              )}

              {!showArchitectureCreatedHome ? executiveBottomLineEl : null}

              {tabbedWorkspaceEl}

              {!m.manifestId ? (
                (() => {
                  const legacyStatus = m.resolvedDetail.run.legacyRunStatus;
                  const isDeadLettered = m.resolvedDetail.run.isDeadLettered === true;
                  const stalled = detectStalledReview(
                    m.resolvedDetail.run.createdUtc,
                    m.resolvedDetail.run.completedUtc != null
                      || legacyStatus === "Completed"
                      || legacyStatus === "Failed",
                    Date.now(),
                    isDeadLettered,
                  );

                  return stalled.isStalled ? (
                    <RunDetailStalledReviewGuidanceCalloutDeferred
                      elapsedMinutes={stalled.elapsedMinutes}
                      runId={m.resolvedDetail.run.runId}
                    />
                  ) : null;
                })()
              ) : null}

              {findingCoverageSummary?.hasCommitBlockingFailures === true && !showArchitectureCreatedHome ? (
                <RunDetailCommitBlockingFindingsBannerDeferred
                  runId={m.resolvedDetail.run.runId}
                  reason={commitBlockedReason}
                />
              ) : null}
            </>
          }
          rail={null}
        />
      </RunDetailWorkspaceDisclosureProvider>

      {showArchitectureCreatedHome ? (
        <>
          {reviewPolicyPackCallout !== null ? (
            <RunDetailPolicyPackImpactCalloutDeferred
              ruleSetId={reviewPolicyPackCallout.ruleSetId}
              ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
              runId={m.resolvedDetail.run.runId}
              totalFindingCount={m.findingCountDisplay}
            />
          ) : null}
        </>
      ) : null}

      {blockingApprovalCount === 0 ? (
        <RunDetailFirstWeekRouteGuidanceDeferred
          variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
        />
      ) : null}

      {showArchitectureCreatedHome ? (
        <>
          <RunDetailTechnologyBaselineSection
            runId={m.resolvedDetail.run.runId}
            manifestFinalized={Boolean(m.manifestId)}
            buyerPolished={m.buyerPolishedArtifactTable ?? false}
            usedStaticDemoRun={m.usedStaticDemoRun}
            warningCountDisplay={m.warningCountDisplay ?? 0}
          />

          {!m.manifestId ? (
            <RunDetailCaptureEvidenceSectionDeferred
              runId={m.resolvedDetail.run.runId}
              buyerPolished={m.buyerPolishedArtifactTable ?? false}
            />
          ) : null}

          {m.buyerPolishedArtifactTable && m.manifestId ? (
            <Suspense fallback={<RunDetailDecisionDeltaSkeleton />}>
              <RunDetailDecisionDeltaDeferred
                runId={m.routeRunId}
                resolvedDetail={m.resolvedDetail}
                explanationSummary={m.explanationSummary}
                isCommitted
              />
            </Suspense>
          ) : null}

          {m.manifestId && m.resolvedDetail.trustEvidenceCard ? (
            <RunDetailTrustEvidenceCardSectionDeferred
              card={m.resolvedDetail.trustEvidenceCard}
              runId={m.resolvedDetail.run.runId}
              evidenceAskRunId={m.buyerPolishedArtifactTable ? m.resolvedDetail.run.runId : null}
            />
          ) : null}

          {m.manifestId && m.manifestSummaryForUi ? (
            <RunDetailManifestSummarySectionDeferred
              manifestSummary={m.manifestSummaryForUi}
              buyerPolishedShell={m.buyerPolishedArtifactTable}
              runExecution={{
                realModeFellBackToSimulator: m.resolvedDetail.run.realModeFellBackToSimulator,
                pilotAoaiDeploymentSnapshot: m.resolvedDetail.run.pilotAoaiDeploymentSnapshot ?? null,
              }}
            />
          ) : null}

          {m.manifestId ? (
            <RunDetailReviewPackageShareRowDeferred
              runId={m.resolvedDetail.run.runId}
              manifestId={m.manifestId}
              completedUtc={m.resolvedDetail.run.completedUtc}
            />
          ) : null}

          {m.explanationSummary !== null ? (
            <RunDetailExplanationConfidenceBannerDeferred summary={m.explanationSummary} />
          ) : null}

          <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
            <RunDetailMidDeferredSections context={deferredContext} />
          </Suspense>

          {!m.buyerPolishedArtifactTable ? (
            <Suspense
              fallback={
                <div
                  className="h-12 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
                  role="status"
                  aria-label="Loading comparison banner"
                />
              }
            >
              <RunDetailWhatIfBranchCompareBannerDeferred
                currentRunId={m.resolvedDetail.run.runId}
                hasCurrentManifest={Boolean(m.manifestId)}
              />
            </Suspense>
          ) : null}

          <RunDetailHolisticCriticPanelDeferred
            runId={m.resolvedDetail.run.runId}
            hasGoldenManifest={Boolean(m.manifestId)}
          />
          {buyerFinalizedPackage ? null : showGovernanceCtaCard ? governanceCtaEl : null}

          <RunDetailLastFailureCardDeferred
            summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
            legacyRunStatus={
              (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
            }
          />

          {buyerFinalizedPackage ? null : (
            <RunDetailExecutiveSummaryCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
          )}

          {!m.buyerPolishedArtifactTable ? (
            <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
              <RunDetailGenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
            </div>
          ) : null}

          {!m.buyerPolishedArtifactTable ? (
            <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
          ) : null}

          {showDemoMarketingChrome ? sampleReviewPackageSummaryEl : null}

          {!m.buyerPolishedArtifactTable ? (
            <RunDetailOperatorTechnicalForensicsPanelDeferred
              agentExecutionLlmCostEstimate={m.resolvedDetail.agentExecutionLlmCostEstimate}
              results={m.resolvedDetail.results}
              agentExecutionOutcomes={m.resolvedDetail.agentExecutionOutcomes}
              retrievalGroundingSummary={m.resolvedDetail.retrievalGroundingSummary}
              run={m.resolvedDetail.run}
              runDetailTraceId={m.runDetailTraceId}
            />
          ) : null}

          {m.showProgressTracker && m.manifestId ? (
            <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
          ) : null}

          {buyerFinalizedPackage ? null : sectionNavEl}

          {resolveRunDetailSponsorBriefingSection(m)}

          <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
            <RunDetailBelowFoldSectionsDeferred model={m} context={deferredContext} />
          </Suspense>
        </>
      ) : null}

      {governanceAlertsEl}

      {m.buyerPolishedArtifactTable ? (
        <RunDetailBuyerModeFallbackBannerDeferred
          realModeFellBackToSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
        />
      ) : null}

      <RunDetailBuyerPilotConversionSectionDeferred buyerPolishedArtifactTable={m.buyerPolishedArtifactTable} />
    </div>
  );

  return (
    <div
      data-testid="review-detail-root"
      data-buyer-golden-ready={buyerGoldenPageReady ? "true" : "false"}
    >
      {runDetailBody}
    </div>
  );
}
