import { Suspense } from "react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import { resolveReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import { RunDetailActivityTabSectionNav } from "@/components/runs/RunDetailActivityTabSectionNav";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";

import {
  BeforeAfterDeltaPanelDeferred,
  RecurrenceSchedulePostCommitCardDeferred,
  ReviewDetailWorkspaceDeferred,
  RunDetailArtifactsExportsSectionDeferred,
  RunDetailBelowFoldSectionsDeferred,
  RunDetailColdOpenOrientationDeferred,
  RunDetailCompareToBaselineCta,
  RunDetailEvidenceTabPanelDeferred,
  RunDetailSponsorBottomLineDeferred,
  RunDetailSponsorReportCtaCardDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailGenerateAdrFromRunModal,
  RunDetailGovernanceCtaDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailManifestSummaryAlertsDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailOutcomeCardsDeferred,
  RunDetailOverviewPanelClientDeferred,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailProgressTrackerDeferred,
  RunDetailReviewPackageSectionDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
  RunDetailRunActionsSectionDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailTechnologyBaselineSection,
  RunDetailWhatIfBranchCompareBannerDeferred,
  RunDetailWorkspaceBlockingBannerDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import {
  RunDetailPackageChangesSinceFinalizeSection,
} from "./RunDetailPackageChangesSinceFinalizeSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import {
  RunDetailArchitectureGraphIsland,
  RunDetailPostCommitHabitIsland,
} from "./RunDetailTabbedDeferredIslands";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailExplanationSkeleton,
  RunDetailMidDeferredSkeleton,
  RunDetailPackageChangesSinceFinalizeSkeleton,
} from "./RunDetailDeferredSkeleton";
import { RunDetailDecisionDeltaDeferred } from "./RunDetailDecisionDeltaDeferred";
import { RunDetailDecisionDeltaSkeleton } from "./RunDetailDecisionDeltaSkeleton";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import { ReviewInPipelineBanner } from "@/components/reviews/ReviewInPipelineBanner";
import type { RunDetailPageModel } from "./run-detail-page-model";

export type RunDetailTabbedWorkspaceProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

/** Tabbed review-detail workspace for the standard (non create-home) run detail layout. */
export function RunDetailTabbedWorkspace(props: RunDetailTabbedWorkspaceProps): React.JSX.Element | null {
  const m = props.model;
  const p = props.presentation;
  const {
    architectureEditHref,
    architectureSummaryTitle,
    blockingApprovalCount,
    lowExtractionConfidenceCount,
    buyerFinalizedPackage,
    deferredContext,
    evidenceCoverageSummary,
    evidenceInventoryCount,
    evidenceInventoryItems,
    evidenceReviewDateLabel,
    executiveBottomLineContent,
    findingCoverageSummary,
    findingsSummaryLine,
    governanceOutcomeLine,
    hasSubmittedArchitecture,
    materialSeverityLine,
    pendingDecisionCount,
    primaryConcernFindingId,
    primaryConcernLabel,
    quickDecisionFindings,
    recommendedActions,
    reviewDisplayTitle,
    reviewOwnerLabel,
    reviewPolicyPackCallout,
    reviewStatusSummary,
    severityCounts,
    showArchitectureCreatedHome,
    showDemoMarketingChrome,
    showGovernanceCta,
    showGovernanceCtaCard,
    showcasePolicyPackStrip,
    submittedArchitectureText,
    workspaceStatus,
    requestAssumptionTexts,
  } = p;

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
      pagePrimaryOwnedElsewhere
    />
  ) : null;

const sampleReviewPackageSummaryEl =
  m.usedStaticDemoRun ? (
    <RunDetailSampleReviewPackageSummaryDeferred
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      artifactCount={m.artifacts.length}
      findingCount={m.findingCountDisplay}
    />
  ) : null;

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
    pagePrimaryOwnedElsewhere
  />
);
const executiveBottomLineEl =
  blockingApprovalCount === 0 ? (
    <RunDetailSponsorBottomLineDeferred content={executiveBottomLineContent} />
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
    requestAssumptionTexts={requestAssumptionTexts}
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
    pagePrimaryOwnedElsewhere
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
  if (showArchitectureCreatedHome) {
    return null;
  }

  const inPipelineBannerEl = m.showProgressTracker ? (
    <ReviewInPipelineBanner runId={m.resolvedDetail.run.runId} initialSummary={m.progressForPipelineUi} />
  ) : null;

  return (
  <Suspense fallback={<RunDetailExplanationSkeleton />}>
    <ReviewDetailWorkspaceDeferred
      runId={m.resolvedDetail.run.runId}
      inPipelineBanner={inPipelineBannerEl}
      lifecycle={resolveReviewWorkspaceLifecycle({
        manifestId: m.manifestId,
        showProgressTracker: m.showProgressTracker,
        runCompleted: m.resolvedDetail.run.completedUtc != null,
      })}
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
            <RunDetailColdOpenOrientationDeferred
              runId={m.resolvedDetail.run.runId}
              packageTitle={reviewDisplayTitle}
              packageOwnerLabel={reviewOwnerLabel}
              workspaceStatus={workspaceStatus}
            />
            {blockingApprovalCount > 0 ? (
              <RunDetailWorkspaceBlockingBannerDeferred blockingCount={blockingApprovalCount} />
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
            {executiveBottomLineEl}
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
              <RunDetailSponsorReportCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
            )}
          </div>
        ),
        findings: (
          <>
            {m.explanationSummary !== null ? (
              <RunDetailExplanationConfidenceBannerDeferred summary={m.explanationSummary} />
            ) : null}
            {explanationDeferredEl}
            <RunDetailHolisticCriticPanelDeferred runId={m.resolvedDetail.run.runId} />
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
                architectureRequestId={m.resolvedDetail.run.architectureRequestId}
                packAssignments={m.manifestSummaryForUi?.effectiveGovernanceAtCommit?.packAssignments}
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
                lowExtractionConfidenceCount={lowExtractionConfidenceCount}
              />
            ) : null}
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
              <Suspense fallback={<RunDetailPackageChangesSinceFinalizeSkeleton />}>
                <RunDetailPackageChangesSinceFinalizeSection
                  context={deferredContext}
                  finalizeUtc={
                    m.manifestSummaryForUi?.createdUtc?.trim() ||
                    m.manifestSummary?.createdUtc?.trim() ||
                    null
                  }
                />
              </Suspense>
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
                pagePrimaryOwnedElsewhere
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
  );
}
