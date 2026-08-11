import { Suspense } from "react";

import dynamic from "next/dynamic";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { RunDetailWhatsNextSection } from "@/components/RunDetailWhatsNextSection";
import { GovernanceApprovalAttestationBlock } from "@/components/reviews/GovernanceApprovalAttestationBlock";
import { ReviewChainOfCustodySection } from "@/components/reviews/ReviewChainOfCustodySection";
import { ReviewCliReproduceSection } from "@/components/reviews/ReviewCliReproduceSection";
import { RunAgentForensicsSection } from "@/components/RunAgentForensicsSection";
import { RunAgentQualityWarningsSection } from "@/components/RunAgentQualityWarningsSection";

import { RunDetailAdvancedAnalysisSection } from "./RunDetailAdvancedAnalysisSection";
import { RunDetailManifestSummaryAlerts } from "./RunDetailManifestSummaryAlerts";
import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";
import { RunDetailOperatorTechnicalFooter } from "./RunDetailOperatorTechnicalFooter";
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
import { RunDetailArtifactsExportsSectionDeferred } from "./run-detail-page-view-deferred-chunks";
import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";

const BeforeAfterDeltaPanel = dynamic(
  () => import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
  { loading: () => null },
);

const RunDetailArchitectureGraphSection = dynamic(
  () =>
    import("./RunDetailArchitectureGraphSection").then(
      (module) => module.RunDetailArchitectureGraphSection,
    ),
  {
    loading: () => (
      <section id="architecture-graph" className="scroll-mt-24">
        <div
          className="h-64 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          role="status"
          aria-label="Loading architecture graph"
        />
      </section>
    ),
  },
);

/** TB-2021 — below-fold client islands (habit loop / authority / grounding). */
const PostCommitHabitLoopCard = dynamic(
  () => import("@/components/PostCommitHabitLoopCard").then((module) => module.PostCommitHabitLoopCard),
  { loading: () => null },
);

const RecurrenceSchedulePostCommitCard = dynamic(
  () =>
    import("@/components/governance/RecurrenceSchedulePostCommitCard").then(
      (module) => module.RecurrenceSchedulePostCommitCard,
    ),
  { loading: () => null },
);

const RunDetailAuthorityChainSection = dynamic(
  () =>
    import("./RunDetailAuthorityChainSection").then(
      (module) => module.RunDetailAuthorityChainSection,
    ),
  { loading: () => null },
);

const RunDetailRetrievalGroundingSection = dynamic(
  () =>
    import("./RunDetailRetrievalGroundingSection").then(
      (module) => module.RunDetailRetrievalGroundingSection,
    ),
  { loading: () => null },
);

type RunDetailBelowFoldSectionsProps = {
  readonly model: RunDetailPageModel;
  readonly context: RunDetailDeferredSectionContext;
  /**
   * `LEGACY_HASH_TO_TAB` already assigns run explanation, deliverables, manifest alerts, and run
   * actions to the Findings / Evidence / Policies / Signed review record tabs. The tabbed workspace
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
        <RunDetailArchitectureGraphSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
          anchorRunCreatedUtc={m.resolvedDetail.run.createdUtc}
          graphHistoryMinCreatedUtc={projectContext.architectureGraphTemporalMinUtc}
          disableTemporalBrowsing={m.usedStaticDemoRun}
        />
      ) : null}

      {m.manifestId ? (
        <PostCommitHabitLoopCard
          runId={m.routeRunId}
          showCompareCta={projectContext.canShowCompareReviewButton}
          buyerShowcaseQuickLinks={m.usedStaticDemoRun}
          goldenManifestId={m.manifestId}
        />
      ) : null}
    </>
  );
}

/**
 * Streams pipeline, graph, and technical appendices after first-screen run detail chrome.
 * Sync shell + nested Suspense so independent below-fold fetches do not block each other (TB-2026).
 */
export function RunDetailBelowFoldSections(props: RunDetailBelowFoldSectionsProps): React.JSX.Element {
  const m = props.model;
  const findingCoverageSummary = m.resolvedDetail.findingCoverageSummary ?? null;
  const ownedByAnotherTab = props.renderedInsideTabbedWorkspace === true;

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
        <RunDetailAuthorityChainSection run={m.resolvedDetail.run} manifestId={m.manifestId} />
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

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailProvenanceSummaryCard
          runId={m.routeRunId}
          run={m.resolvedDetail.run}
          engineProvenance={m.resolvedDetail.engineProvenance ?? null}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <ReviewChainOfCustodySection
          run={m.resolvedDetail.run}
          manifestId={m.manifestId ?? null}
          ruleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
          ruleSetVersion={m.manifestSummaryForUi?.ruleSetVersion ?? null}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <ReviewCliReproduceSection
          runId={m.resolvedDetail.run.runId}
          ruleSetId={m.manifestSummaryForUi?.ruleSetId ?? null}
        />
      ) : null}

      {!m.manifestId ? <RunDetailPreFinalizedEmptyState /> : null}

      {ownedByAnotherTab ? null : (
        <RunDetailManifestSummaryAlerts
          manifestSummaryFailure={m.manifestSummaryFailure}
          manifestSummaryMalformed={m.manifestSummaryMalformed}
        />
      )}

      {m.manifestId && !ownedByAnotherTab ? (
        <>
          <RunDetailWhatsNextSection runId={m.routeRunId} />
          <RecurrenceSchedulePostCommitCard
            runId={m.routeRunId}
            hasStickinessPrompt={Boolean(m.manifestId)}
          />
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
        />
      ) : null}

      {!ownedByAnotherTab && !m.buyerPolishedArtifactTable && m.manifestId ? (
        <RunDetailRetrievalGroundingSection
          runId={m.routeRunId}
          showWhenFaithfulnessWarning={
            typeof m.explanationSummary?.faithfulnessWarning === "string"
            && m.explanationSummary.faithfulnessWarning.trim().length > 0
          }
        />
      ) : null}

      {m.manifestId && !ownedByAnotherTab && !m.buyerPolishedArtifactTable ? (
        <BeforeAfterDeltaPanel variant="inline" runId={m.routeRunId} />
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
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailOperatorTechnicalFooter
          runId={m.resolvedDetail.run.runId}
          projectId={m.resolvedDetail.run.projectId}
          createdLabel={m.createdLabel}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
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
