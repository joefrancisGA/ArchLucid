import { Suspense } from "react";

import { GovernanceModePresentationGate } from "@/components/governance/GovernanceModePresentationGate";
import { ArchitectureSealDeltaPanel } from "@/components/architecture/ArchitectureSealDeltaPanel";
import { GovernanceApprovalAttestationBlock } from "@/components/reviews/GovernanceApprovalAttestationBlock";
import { ReviewChainOfCustodySection } from "@/components/reviews/ReviewChainOfCustodySection";
import { ReviewCliReproduceSection } from "@/components/reviews/ReviewCliReproduceSection";
import { RunAgentForensicsSection } from "@/components/runs/RunAgentForensicsSection";
import { RunAgentQualityWarningsSection } from "@/components/runs/RunAgentQualityWarningsSection";

import { RunDetailAdvancedAnalysisSection } from "./RunDetailAdvancedAnalysisSection";
import { RunDetailManifestSummaryAlerts } from "./RunDetailManifestSummaryAlerts";
import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";
import { PackageChangesSinceFinalizePanel } from "@/components/PackageChangesSinceFinalizePanel";
import { RunDetailPipelineTimelineSection } from "./RunDetailPipelineTimelineSection";
import { RunDetailPipelineStagesSection } from "./RunDetailPipelineStagesSection";
import { RunDetailPreFinalizedEmptyState } from "./RunDetailPreFinalizedEmptyState";
import { RunDetailProvenanceSummaryCard } from "./RunDetailProvenanceSummaryCard";
import { RunDetailRunActionsSection } from "./RunDetailRunActionsSection";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import {
  RunDetailBelowFoldPipelineSkeleton,
  RunDetailBelowFoldProjectContextSkeleton,
  RunDetailExplanationSkeleton,
} from "./RunDetailDeferredSkeleton";
import {
  loadRunDetailBelowFoldPipelineModel,
  loadRunDetailBelowFoldProjectContextModel,
} from "./load-run-detail-deferred-model";
import {
  BeforeAfterDeltaPanelDeferred,
  RecurrenceSchedulePostCommitCardDeferred,
  RunDetailArtifactsExportsSectionDeferred,
  RunDetailAuthorityChainSectionDeferred,
  RunDetailRetrievalGroundingSectionDeferred,
} from "./run-detail-page-view-deferred-chunks";
import {
  RunDetailArchitectureGraphSectionDeferred,
  RunDetailPostCommitHabitLoopCardDeferred,
} from "./run-detail-tabbed-deferred-chunks";
import {
  deriveRunDetailWorkspaceStatus,
  isReviewPipelineIncomplete,
} from "@/lib/run-detail-workspace-derive";
import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";
import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";

export type RunDetailBelowFoldSectionsProps = {
  readonly model: RunDetailPageModel;
  readonly context: RunDetailDeferredSectionContext;
  /**
   * `LEGACY_HASH_TO_TAB` already assigns run explanation, deliverables, manifest alerts, and run
   * actions to the Findings / Evidence / Policies / Finalized review record tabs. The tabbed workspace
   * mounts them there, so this shared block must omit them to avoid rendering the same anchor id on
   * two tabs. The legacy single-column path passes nothing and still renders every section.
   */
  readonly renderedInsideTabbedWorkspace?: boolean;
};

type BelowFoldAsyncProps = {
  readonly model: RunDetailPageModel;
  readonly context: RunDetailDeferredSectionContext;
};

async function RunDetailBelowFoldProjectContextAsync(
  props: BelowFoldAsyncProps,
): Promise<React.JSX.Element> {
  const m = props.model;
  const projectContext = await loadRunDetailBelowFoldProjectContextModel(props.context);

  return (
    <>
      {m.resolvedDetail.run.graphSnapshotId ? (
        <RunDetailArchitectureGraphSectionDeferred
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
          anchorRunCreatedUtc={m.resolvedDetail.run.createdUtc}
          graphHistoryMinCreatedUtc={projectContext.architectureGraphTemporalMinUtc}
          disableTemporalBrowsing={m.usedStaticDemoRun}
        />
      ) : null}

      {m.manifestId ? (
        <RunDetailPostCommitHabitLoopCardDeferred
          runId={m.routeRunId}
          showCompareCta={projectContext.canShowCompareReviewButton}
          buyerShowcaseQuickLinks={m.usedStaticDemoRun}
          goldenManifestId={m.manifestId}
          pagePrimaryOwnedElsewhere
        />
      ) : null}
    </>
  );
}

/**
 * Streams pipeline, graph, and technical appendices after first-screen run detail chrome.
 * Sync shell + nested Suspense so independent below-fold fetches do not block each other (TB-2026).
 *
 * Server Component only. A client deferred-chunk wrapper would run timelines-bundle
 * in the browser and re-fetch on every parent render.
 */
export function RunDetailBelowFoldSections(props: RunDetailBelowFoldSectionsProps): React.JSX.Element {
  const m = props.model;
  const findingCoverageSummary = m.resolvedDetail.findingCoverageSummary ?? null;
  const ownedByAnotherTab = props.renderedInsideTabbedWorkspace === true;
  const terminalFailure = isReviewPipelineTerminalFailure(m.pipelineDiagnosticContext);
  const hasSealedRecord = Boolean(m.manifestId);
  const reviewPipelineComplete = !isReviewPipelineIncomplete(
    deriveRunDetailWorkspaceStatus({
      run: m.resolvedDetail.run,
      manifestId: m.manifestId,
      manifestStatus: m.manifestSummary?.status ?? null,
      showProgressTracker: m.showProgressTracker,
      operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
      buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    }),
  );

  return (
    <>
      {!ownedByAnotherTab && !m.buyerPolishedArtifactTable && m.manifestId ? (
        <Suspense fallback={<RunDetailExplanationSkeleton />}>
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
        </Suspense>
      ) : null}

      <Suspense fallback={<RunDetailBelowFoldPipelineSkeleton />}>
        <RunDetailBelowFoldPipelineAsync model={m} context={props.context} />
      </Suspense>

      <GovernanceModePresentationGate>
        <RunDetailAuthorityChainSectionDeferred run={m.resolvedDetail.run} manifestId={m.manifestId} />
      </GovernanceModePresentationGate>

      <GovernanceModePresentationGate>
        {m.resolvedDetail.run.operatorGovernanceDecision ? (
          <GovernanceApprovalAttestationBlock
            decision={m.resolvedDetail.run.operatorGovernanceDecision}
            approvedByUserId={m.resolvedDetail.run.operatorGovernanceDecisionByUserId ?? null}
            decisionUtc={m.resolvedDetail.run.operatorGovernanceDecisionUtc ?? null}
            rationale={m.resolvedDetail.run.operatorGovernanceDecisionRationale ?? null}
            runId={m.resolvedDetail.run.runId}
          />
        ) : null}
      </GovernanceModePresentationGate>

      {!m.buyerPolishedArtifactTable && hasSealedRecord ? (
        <RunDetailProvenanceSummaryCard
          runId={m.routeRunId}
          run={m.resolvedDetail.run}
          engineProvenance={m.resolvedDetail.engineProvenance ?? null}
          manifestId={m.manifestId}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable && hasSealedRecord ? (
        <ReviewChainOfCustodySection
          run={m.resolvedDetail.run}
          manifestId={m.manifestId ?? null}
          ruleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
          ruleSetVersion={m.manifestSummaryForUi?.ruleSetVersion ?? null}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable && hasSealedRecord ? (
        <ReviewCliReproduceSection
          runId={m.resolvedDetail.run.runId}
          ruleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
        />
      ) : null}

      {!hasSealedRecord && !terminalFailure ? (
        <RunDetailPreFinalizedEmptyState
          runId={m.routeRunId}
          terminalFailure={terminalFailure}
          recoveryStepsAvailable={false}
        />
      ) : null}

      {ownedByAnotherTab ? null : (
        <RunDetailManifestSummaryAlerts
          manifestSummaryFailure={m.manifestSummaryFailure}
          manifestSummaryMalformed={m.manifestSummaryMalformed}
        />
      )}

      {m.manifestId && !ownedByAnotherTab ? (
        <>
          <RecurrenceSchedulePostCommitCardDeferred
            runId={m.routeRunId}
            architectureId={m.resolvedDetail.run.architectureId ?? null}
            architectureDisplayName={m.headline}
            hasStickinessPrompt={Boolean(m.manifestId)}
            pagePrimaryOwnedElsewhere
          />
          {m.resolvedDetail.run.architectureId ? (
            <ArchitectureSealDeltaPanel
              architectureId={m.resolvedDetail.run.architectureId}
              currentReviewRunId={m.routeRunId}
            />
          ) : null}
        </>
      ) : null}

      {!ownedByAnotherTab ? (
        <Suspense fallback={<RunDetailBelowFoldProjectContextSkeleton />}>
          <RunDetailBelowFoldProjectContextAsync model={m} context={props.context} />
        </Suspense>
      ) : null}

      {m.manifestId && !ownedByAnotherTab ? (
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
          requestId={m.resolvedDetail.run.architectureRequestId ?? (m.resolvedDetail.run as { requestId?: string }).requestId}
          enginesSucceeded={findingCoverageSummary?.enginesSucceeded ?? null}
          progressSummary={m.resolvedDetail.run}
          graphSnapshot={m.resolvedDetail.graphSnapshot}
          pagePrimaryOwnedElsewhere
        />
      ) : null}

      {!ownedByAnotherTab && !m.buyerPolishedArtifactTable && m.manifestId ? (
        <RunDetailRetrievalGroundingSectionDeferred
          runId={m.routeRunId}
          showWhenFaithfulnessWarning={
            typeof m.explanationSummary?.faithfulnessWarning === "string"
            && m.explanationSummary.faithfulnessWarning.trim().length > 0
          }
        />
      ) : null}

      {m.manifestId && !ownedByAnotherTab && !m.buyerPolishedArtifactTable ? (
        <BeforeAfterDeltaPanelDeferred variant="inline" runId={m.routeRunId} />
      ) : null}

      {m.manifestId && !ownedByAnotherTab ? (
        <RunDetailAdvancedAnalysisSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? <RunAgentQualityWarningsSection runId={m.routeRunId} /> : null}

      {!m.buyerPolishedArtifactTable ? <RunAgentForensicsSection runId={m.routeRunId} /> : null}

      {!m.buyerPolishedArtifactTable && !ownedByAnotherTab ? (
        <RunDetailRunActionsSection
          runId={m.resolvedDetail.run.runId}
          systemName={m.resolvedDetail.run.description?.trim() || m.resolvedDetail.run.runId}
          manifestId={m.manifestId}
          hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
          operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision ?? null}
          isArchived={m.resolvedDetail.run.isArchived === true}
          pipelineInFlight={m.showProgressTracker && !m.manifestId}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable && reviewPipelineComplete ? (
        <RunDetailOperatorPipelineToolsCollapsible runId={m.resolvedDetail.run.runId} />
      ) : null}
    </>
  );
}

// Declared after RunDetailBelowFoldSections (hoisted) so the operator findings JSX above stays
// textually ahead of the pipeline timeline JSX below (TB-620 below-fold ordering guard).
async function RunDetailBelowFoldPipelineAsync(props: BelowFoldAsyncProps): Promise<React.JSX.Element> {
  const m = props.model;
  const pipeline = await loadRunDetailBelowFoldPipelineModel(props.context);

  const finalizeUtc =
    m.manifestSummaryForUi?.createdUtc?.trim() ||
    m.manifestSummary?.createdUtc?.trim() ||
    null;

  return (
    <>
      <RunDetailPipelineTimelineSection
        runId={m.routeRunId}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        pipelineTimelineFailure={pipeline.pipelineTimelineFailure}
        pipelineTimelineForUi={pipeline.pipelineTimelineForUi}
      />

      {m.manifestId ? (
        <PackageChangesSinceFinalizePanel
          events={pipeline.pipelineTimelineAllForPackageChanges}
          finalizeUtc={finalizeUtc}
        />
      ) : null}

      <RunDetailPipelineStagesSection
        stageTimeline={pipeline.stageTimelineForUi}
        otelTraceId={m.resolvedDetail.run.otelTraceId ?? m.runDetailTraceId}
      />
    </>
  );
}
