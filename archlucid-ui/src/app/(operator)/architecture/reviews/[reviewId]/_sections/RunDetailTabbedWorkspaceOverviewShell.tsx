import { Suspense } from "react";

import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import {
  RunDetailColdOpenOrientationDeferred,
  RunDetailMidDeferredSections,
  RunDetailMidDeferredSkeleton,
  RunDetailOverviewPanelClientDeferred,
  RunDetailOutcomeCardsDeferred,
  RunDetailSponsorBottomLineDeferred,
  RunDetailSponsorReportCtaCardDeferred,
  RunDetailWorkspaceBlockingBannerDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
} from "./RunDetailTabbedWorkspaceDeferredImports";
import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import { deriveDecisionSnapshotSuppressedReason, isReviewPipelineIncomplete } from "@/lib/run-detail-workspace-derive";

export type RunDetailTabbedWorkspaceOverviewShellInput = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
};

/** Composes the overview tab panel for the tabbed run-detail workspace. */
export function composeRunDetailTabbedWorkspaceOverviewShell(
  input: RunDetailTabbedWorkspaceOverviewShellInput,
): React.JSX.Element {
  const m = input.model;
  const p = input.presentation;
  const {
    architectureSummaryTitle,
    blockingApprovalCount,
    buyerFinalizedPackage,
    deferredContext,
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
      authorityLifecyclePhase={m.resolvedDetail.authorityLifecyclePhase ?? null}
      showcasePolicyPackStrip={p.showcasePolicyPackStrip}
      degradedFindingCoverage={m.resolvedDetail.degradedFindingCoverage === true}
      failedEngineLabels={p.findingCoverageSummary?.failedEngineLabels ?? []}
      findingCoverageSummary={p.findingCoverageSummary}
      pagePrimaryOwnedElsewhere
    />
  );

  const executiveBottomLineEl =
    blockingApprovalCount === 0 ? (
      <RunDetailSponsorBottomLineDeferred content={executiveBottomLineContent} />
    ) : null;
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
      <RunDetailWorkspaceSummaryStripDeferred
        outcomeHeading={m.manifestId ? "Governance decision" : "Review posture"}
        reviewOutcome={m.manifestId ? governanceOutcomeLine : reviewStatusSummary.reviewOutcome}
        highestUnresolvedSeverity={reviewStatusSummary.highestUnresolvedSeverity}
        findingsSummaryLine={findingsSummaryLine}
        evidenceCoverageLine={p.evidenceCoverageSummary.summaryLine}
        primaryConcern={reviewStatusSummary.primaryConcern}
        materialSeverityLine={materialSeverityLine}
        suppressedReason={decisionSnapshotSuppressedReason}
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
        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
          <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
          <div className="mt-3">{outcomeCardsEl}</div>
        </details>
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
