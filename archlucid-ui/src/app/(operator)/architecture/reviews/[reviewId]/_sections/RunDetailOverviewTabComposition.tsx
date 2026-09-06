import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import {
  RunDetailColdOpenOrientationDeferred,
  RunDetailMidDeferredSections,
  RunDetailMidDeferredSkeleton,
  RunDetailOutcomeCardsDeferred,
  RunDetailOverviewPanelClientDeferred,
  RunDetailSponsorBottomLineDeferred,
  RunDetailSponsorReportCtaCardDeferred,
  RunDetailWorkspaceBlockingBannerDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
} from "./RunDetailTabbedWorkspaceDeferredImports";
import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { RunDetailSealDeskCoverageStrip } from "@/components/reviews/RunDetailSealDeskCoverageStrip";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import { Suspense } from "react";
import { RunDetailDetailedOutcomeCardsDisclosure } from "./RunDetailDetailedOutcomeCardsDisclosure";
import { RunDetailInfeasibleDecisionLead } from "./RunDetailInfeasibleDecisionLead";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import { deriveDecisionSnapshotSuppressedReason, isReviewPipelineIncomplete } from "@/lib/run-detail-workspace-derive";

export type RunDetailOverviewTabCompositionInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
  readonly outcomeCardsEl: React.ReactNode;
};

export function composeRunDetailOverviewTab(
  input: RunDetailOverviewTabCompositionInput,
): React.JSX.Element {
  const m = input.model;
  const p = input.presentation;
  const {
    blockingApprovalCount,
    buyerFinalizedPackage,
    deferredContext,
    evidenceCoverageSummary,
    evidenceInventoryCount,
    executiveBottomLineContent,
    findingsSummaryLine,
    governanceOutcomeLine,
    hasSubmittedArchitecture,
    materialSeverityLine,
    recommendedActions,
    reviewDisplayTitle,
    reviewOwnerLabel,
    reviewStatusSummary,
    severityCounts,
    submittedArchitectureText,
    workspaceStatus,
  } = p;

  const executiveBottomLineEl =
    blockingApprovalCount === 0 ? (
      <RunDetailSponsorBottomLineDeferred content={executiveBottomLineContent} />
    ) : null;
  const feasibilityVerdict: ManifestFeasibilityVerdict | null =
    m.manifestSummary?.feasibilityVerdict ?? m.manifestSummaryForUi?.feasibilityVerdict ?? null;
  const runCompleted = m.resolvedDetail.run.legacyRunStatus === "Completed" || Boolean(m.manifestId);
  const decisionSnapshotSuppressedReason = deriveDecisionSnapshotSuppressedReason(workspaceStatus);
  const showDetailedOutcomeCards = !isReviewPipelineIncomplete(workspaceStatus);

  return (
    <div key="review-detail-overview-panel" className="space-y-4">
      <RunDetailColdOpenOrientationDeferred
        runId={m.resolvedDetail.run.runId}
        packageTitle={reviewDisplayTitle}
        packageOwnerLabel={reviewOwnerLabel}
        workspaceStatus={workspaceStatus}
      />
      {blockingApprovalCount > 0 ? (
        <RunDetailWorkspaceBlockingBannerDeferred blockingCount={blockingApprovalCount} />
      ) : null}
      <RunDetailInfeasibleDecisionLead feasibilityVerdict={feasibilityVerdict} runId={m.resolvedDetail.run.runId} />
      <RunDetailWorkspaceSummaryStripDeferred
        outcomeHeading={m.manifestId ? "Governance decision" : "Review posture"}
        reviewOutcome={m.manifestId ? governanceOutcomeLine : reviewStatusSummary.reviewOutcome}
        highestUnresolvedSeverity={reviewStatusSummary.highestUnresolvedSeverity}
        findingsSummaryLine={findingsSummaryLine}
        evidenceCoverageLine={evidenceCoverageSummary.summaryLine}
        primaryConcern={reviewStatusSummary.primaryConcern}
        materialSeverityLine={materialSeverityLine}
        suppressedReason={decisionSnapshotSuppressedReason}
      />
      {executiveBottomLineEl}
      <RunDetailOverviewTransparencyTrail
        feasibilityVerdict={feasibilityVerdict}
        runCompleted={runCompleted}
      />
      <RunDetailSealDeskCoverageStrip
        runId={m.resolvedDetail.run.runId}
        analysisStagesComplete={analysisStagesCompleteOnSummary(m.progressForPipelineUi)}
        graphSnapshot={m.resolvedDetail.graphSnapshot}
        transparencyTrail={feasibilityVerdict?.transparencyTrail ?? null}
      />
      <RunDetailOverviewPanelClientDeferred
        runId={m.resolvedDetail.run.runId}
        architectureTitle={p.architectureSummaryTitle}
        architectureText={submittedArchitectureText}
        evidenceCount={evidenceInventoryCount}
        hasSubmittedArchitecture={hasSubmittedArchitecture}
        userAssertions={null}
        recommendedActions={recommendedActions}
        criticalCount={severityCounts.critical}
        highCount={severityCounts.high}
        pipelineIncomplete={!showDetailedOutcomeCards}
        proofStatusSlot={
          <RunDetailFirstScreenProofStatusClient
            key="run-detail-overview-proof-status"
            runId={m.resolvedDetail.run.runId}
            legacyRunStatus={m.resolvedDetail.run.legacyRunStatus ?? null}
            isDeadLettered={m.resolvedDetail.run.isDeadLettered === true}
          />
        }
      />
      {showDetailedOutcomeCards ? (
        <RunDetailDetailedOutcomeCardsDisclosure>
          {input.outcomeCardsEl}
        </RunDetailDetailedOutcomeCardsDisclosure>
      ) : null}
      <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
        <RunDetailMidDeferredSections context={deferredContext} />
      </Suspense>
      {buyerFinalizedPackage || !runCompleted ? null : (
        <RunDetailSponsorReportCtaCardDeferred
          runId={m.resolvedDetail.run.runId}
          manifestId={m.manifestId}
          demoted
        />
      )}
    </div>
  );
}

export function buildRunDetailOutcomeCards(
  model: RunDetailPageModel,
  presentation: RunDetailPresentation,
): React.JSX.Element {
  const { findingCoverageSummary, showcasePolicyPackStrip } = presentation;

  return (
    <RunDetailOutcomeCardsDeferred
      runId={model.resolvedDetail.run.runId}
      manifestId={model.manifestId}
      artifactCount={model.artifacts.length}
      findingCountDisplay={model.findingCountDisplay}
      warningCountDisplay={model.warningCountDisplay}
      hasGoldenManifest={Boolean(model.manifestId)}
      unresolvedIssueCountDisplay={model.manifestSummary?.unresolvedIssueCount ?? null}
      aggregateRiskPosture={model.explanationSummary?.riskPosture ?? null}
      governanceGateLabel={model.governanceGateLabel}
      authorityLifecyclePhase={model.resolvedDetail.authorityLifecyclePhase ?? null}
      showcasePolicyPackStrip={showcasePolicyPackStrip}
      degradedFindingCoverage={model.resolvedDetail.degradedFindingCoverage === true}
      failedEngineLabels={findingCoverageSummary?.failedEngineLabels ?? []}
      findingCoverageSummary={findingCoverageSummary}
      pagePrimaryOwnedElsewhere
    />
  );
}
