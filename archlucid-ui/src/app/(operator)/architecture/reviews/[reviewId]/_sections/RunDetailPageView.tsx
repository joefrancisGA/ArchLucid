import { Suspense } from "react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceModePresentationGate } from "@/components/governance/GovernanceModePresentationGate";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import { ArchitectureIntelligenceReviewToolStrip } from "@/components/ArchitectureIntelligenceReviewToolStrip";
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
  RunDetailSponsorBottomLineDeferred,
  RunDetailSponsorReportCtaCardDeferred,
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
  RunDetailCreateHomeActivityPanelDeferred,
  RunDetailCreateHomeEvidencePanelDeferred,
  RunDetailReviewPackageDoThisNextResolvedDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
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
  RunDetailPreFinalizeChecklistSection,
  RunDetailTrustEvidenceCardSectionDeferred,
  RunDetailWhatIfBranchCompareBannerDeferred,
  ReviewDetailWorkspaceDeferred,
  RunDetailOverviewPanelClientDeferred,
  HelpPageSituationRegistrarDeferred,
  ReviewGenerationCreatedNoticeDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { ReviewPackageAfterFinalizeNextStepsStrip } from "./ReviewPackageAfterFinalizeNextStepsStrip";
import { RunDetailNextReviewFooterClient } from "./RunDetailNextReviewFooterClient";
import { RunDetailBelowFoldSectionsDeferred } from "./RunDetailBelowFoldSectionsDeferred";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import { RunDetailTabbedWorkspace } from "./RunDetailTabbedWorkspace";
import { buildRunDetailPresentation, type RunDetailPresentation } from "./run-detail-page-presentation";
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
import { RunDetailCreateHomeFindingsPanel } from "./RunDetailCreateHomeFindingsPanel";
import type { RunDetailPageModel } from "./run-detail-page-model";

/** Server component: renders the main run detail chrome from a preloaded `RunDetailPageModel`. */
export async function RunDetailPageView(props: {
  readonly model: RunDetailPageModel;
  readonly fromArchitectureCreation?: boolean;
}): Promise<React.JSX.Element> {
  const m = props.model;
  const presentation = await buildRunDetailPresentation(m, props.fromArchitectureCreation === true);
  const {
    architectureCreatedBaseline,
    architectureCreatedHomeModel,
    architectureEditHref,
    architectureSummaryTitle,
    blockingApprovalCount,
    buyerFinalizedPackage,
    buyerGoldenPageReady,
    commitBlockedReason,
    finalizeAssumptionGateApplies,
    requestAssumptionTexts,
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
    signedReviewRecordId,
    signedReviewRecordIdLabel,
    submittedArchitectureText,
    templateLabel,
    workspaceStatus,
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
  };

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
                    finalizeAssumptionGateApplies={finalizeAssumptionGateApplies}
                    quickDecisionFindings={quickDecisionFindings}
                    requestAssumptionTexts={requestAssumptionTexts}
                    {...reviewPackageDoThisNextEvidenceProps}
                  />
                  {m.manifestId ? (
                    <ReviewPackageAfterFinalizeNextStepsStrip runId={m.resolvedDetail.run.runId} />
                  ) : null}
                  <RunDetailWorkspaceDisclosureControls />
                  <Suspense fallback={<RunDetailExplanationSkeleton />}>
                  <RunDetailArchitectureCreatedWorkspaceDeferred
                    baseline={architectureCreatedBaseline}
                    architectureSourceText={submittedArchitectureText ?? ""}
                    canEditDiagram={!m.manifestId}
                    findings={quickDecisionFindings}
                    findingsTriageVisibleCount={findingsTriageVisibleCount}
                    correctionHref={architectureEditHref}
                    pagePrimaryOwnedElsewhere
                    analysisStagesComplete={createHomeAnalysisStagesComplete}
                    panels={{
                      findings: (
                        <RunDetailCreateHomeFindingsPanel
                          runId={m.resolvedDetail.run.runId}
                          packageCommitted={Boolean(m.manifestId)}
                        >
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
                            requestAssumptionTexts={requestAssumptionTexts}
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
                        </RunDetailCreateHomeFindingsPanel>
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
                          artifacts={m.artifacts}
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
                            pagePrimaryOwnedElsewhere
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
                                pagePrimaryOwnedElsewhere
                              />
                            </>
                          ) : null}
                        </>
                      ),
                      activity: (
                        <RunDetailCreateHomeActivityPanelDeferred
                          runId={m.resolvedDetail.run.runId}
                          routeRunId={m.routeRunId}
                          manifestId={m.manifestId ?? null}
                          showProgressTracker={m.showProgressTracker}
                          statusLine={createHomeActivityStatusLine}
                          provenanceAsOfLabel={createHomeActivityProvenanceAsOfLabel}
                          preFinalizeReadyToFinalize={createHomePreFinalizeReadyToFinalize}
                          progressForPipelineUi={m.progressForPipelineUi}
                          pipelineDiagnosticContext={m.pipelineDiagnosticContext}
                          outcomeCards={createHomeActivityOutcomeCardsEl}
                          midDeferred={
                            <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                              <RunDetailMidDeferredSections
                                context={deferredContext}
                                includeSavingsSummary={false}
                              />
                            </Suspense>
                          }
                          sourcesPanel={<RunDetailActivitySourcesPanelDeferred />}
                          pagePrimaryOwnedElsewhere
                        />
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
                    openClarificationGapCount={0}
                    correctionHref={architectureEditHref}
                    useCreateHomeWorkspaceTabs={false}
                    hasGoldenManifest={Boolean(m.manifestId)}
                    commitBlockedReason={commitBlockedReason}
                    finalizeAssumptionGateApplies={finalizeAssumptionGateApplies}
                    quickDecisionFindings={quickDecisionFindings}
                    requestAssumptionTexts={requestAssumptionTexts}
                    {...reviewPackageDoThisNextEvidenceProps}
                  />

                  {m.manifestId ? (
                    <ReviewPackageAfterFinalizeNextStepsStrip runId={m.resolvedDetail.run.runId} />
                  ) : null}

                  {tabbedWorkspaceEl}
                </>
              )}

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
                      summary={m.progressForPipelineUi}
                      diagnosticContext={m.pipelineDiagnosticContext}
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

      <OperatorRelatedSurfacesDisclosure testId="review-detail-related-surfaces-disclosure">
        <ArchitectureIntelligenceReviewToolStrip
          runId={m.resolvedDetail.run.runId}
          currentSurfaceId="review-workspace"
        />
        <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="review-detail" />
      </OperatorRelatedSurfacesDisclosure>

      {showArchitectureCreatedHome ? (
        <>
          {reviewPolicyPackCallout !== null ? (
            <RunDetailPolicyPackImpactCalloutDeferred
              ruleSetId={reviewPolicyPackCallout.ruleSetId}
              ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
              runId={m.resolvedDetail.run.runId}
              totalFindingCount={m.findingCountDisplay}
              architectureRequestId={m.resolvedDetail.run.architectureRequestId}
              effectiveGovernanceAtCommit={reviewPolicyPackCallout.effectiveGovernanceAtCommit}
            />
          ) : null}
        </>
      ) : null}

      {blockingApprovalCount === 0 ? (
        <RunDetailFirstWeekRouteGuidanceDeferred
          variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
          pagePrimaryOwnedElsewhere
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
            <RunDetailPreFinalizeChecklistSection
              runId={m.resolvedDetail.run.runId}
              manifestFinalized={Boolean(m.manifestId)}
            />
          ) : null}

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
            <RunDetailSponsorReportCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
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
            <RunDetailProgressTrackerDeferred
              runId={m.routeRunId}
              initialSummary={m.progressForPipelineUi}
              diagnosticContext={m.pipelineDiagnosticContext}
            />
          ) : null}

          {buyerFinalizedPackage ? null : sectionNavEl}

          {resolveRunDetailSponsorBriefingSection(m, { pagePrimaryOwnedElsewhere: true })}

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

      <RunDetailNextReviewFooterClient runId={m.routeRunId} />
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
