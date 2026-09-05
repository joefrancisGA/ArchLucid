import { Suspense } from "react";

import { RunDetailPresenterElicitationBridge } from "@/components/reviews/RunDetailPresenterElicitationBridge";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import {
  RunDetailExplanationSkeleton,
  RunDetailTabbedSectionNavDeferred,
} from "./RunDetailTabbedWorkspaceDeferredImports";
import { RunDetailReviewPackageDoThisNextResolvedDeferred } from "./run-detail-page-view-deferred-chunks-review-package";
import type { RunDetailTabbedWorkspaceResolved } from "./resolve-run-detail-tabbed-workspace";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";

type RunDetailTabbedWorkspaceShellProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
  readonly resolved: RunDetailTabbedWorkspaceResolved;
};

/** Tab chrome and deferred chunk wiring for the tabbed run-detail workspace. */
export function RunDetailTabbedWorkspaceShell(props: RunDetailTabbedWorkspaceShellProps): React.JSX.Element {
  const { model, presentation, resolved } = props;
  const {
    blockingApprovalCount,
    commitBlockedReason,
    finalizeAssumptionGateApplies,
    quickDecisionFindings,
    requestAssumptionTexts,
    reviewStatusSummary,
    architectureEditHref,
    findingCoverageSummary,
  } = presentation;

  const activePanelLeadEl = (
    <RunDetailReviewPackageDoThisNextResolvedDeferred
      runId={model.resolvedDetail.run.runId}
      manifestId={model.manifestId}
      hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
      blockingFindingCount={blockingApprovalCount}
      buyerPolishedArtifactTable={model.buyerPolishedArtifactTable}
      operatorGovernanceDecision={model.resolvedDetail.run.operatorGovernanceDecision}
      manifestStatus={model.manifestSummary?.status ?? null}
      runCompleted={model.resolvedDetail.run.completedUtc != null}
      nextAction={reviewStatusSummary.nextAction}
      showProgressTracker={model.showProgressTracker}
      legacyRunStatus={model.resolvedDetail.run.legacyRunStatus ?? null}
      isDeadLettered={model.resolvedDetail.run.isDeadLettered === true}
      openClarificationGapCount={0}
      correctionHref={architectureEditHref}
      useCreateHomeWorkspaceTabs={false}
      hasGoldenManifest={Boolean(model.manifestId)}
      commitBlockedReason={commitBlockedReason}
      finalizeAssumptionGateApplies={finalizeAssumptionGateApplies}
      quickDecisionFindings={quickDecisionFindings}
      requestAssumptionTexts={requestAssumptionTexts}
      transparencyTrail={
        model.manifestSummaryForUi?.feasibilityVerdict?.transparencyTrail ??
        model.manifestSummary?.feasibilityVerdict?.transparencyTrail ??
        null
      }
      feasibilityVerdict={
        model.manifestSummaryForUi?.feasibilityVerdict ??
        model.manifestSummary?.feasibilityVerdict ??
        null
      }
      graphSnapshot={model.resolvedDetail.graphSnapshot}
      analysisStagesComplete={analysisStagesCompleteOnSummary(model.progressForPipelineUi)}
      evidenceCoverageLinkedCount={presentation.evidenceCoverageSummary.linkedCount}
      evidenceCoverageTotalCount={presentation.evidenceCoverageSummary.totalCount}
      governanceDecisionRecorded={
        (model.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0
      }
      pipelineDiagnosticContext={model.pipelineDiagnosticContext}
      lastFailureSummary={resolveRunDetailLastFailureSummary(model.resolvedDetail)}
      pipelineSummary={model.progressForPipelineUi}
      runCompletedUtc={model.resolvedDetail.run.completedUtc ?? null}
      intakeDescription={model.resolvedDetail.run.description ?? model.progressForPipelineUi.description ?? null}
      intakeSystemName={model.progressForPipelineUi.displayName ?? null}
      realModeFellBackToSimulator={model.resolvedDetail.run.realModeFellBackToSimulator === true}
    />
  );

  return (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <RunDetailPresenterElicitationBridge
        runId={model.resolvedDetail.run.runId}
        architectureRequestId={model.resolvedDetail.run.architectureRequestId}
        defensibilityStrip={resolved.defensibilityStripEl}
        tabSectionNav={
          <RunDetailTabbedSectionNavDeferred
            runId={model.resolvedDetail.run.runId}
            sections={model.runDetailNavSections}
          />
        }
        inPipelineBanner={resolved.inPipelineBannerEl}
        activePanelLead={activePanelLeadEl}
        lifecycle={resolved.lifecycle}
        tabLifecycle={{
          manifestId: model.manifestId,
          showProgressTracker: model.showProgressTracker,
          runCompleted: model.resolvedDetail.run.completedUtc != null,
        }}
        tabActivityAt={resolved.tabActivityAt}
        tabCounts={resolved.tabCounts}
        panels={resolved.panels}
      />
    </Suspense>
  );
}
