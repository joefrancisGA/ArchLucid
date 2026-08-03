import { Suspense } from "react";

import dynamic from "next/dynamic";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { RunDetailWhatsNextSection } from "@/components/RunDetailWhatsNextSection";
import { GovernanceApprovalAttestationBlock } from "@/components/reviews/GovernanceApprovalAttestationBlock";
import { ReviewChainOfCustodySection } from "@/components/reviews/ReviewChainOfCustodySection";
import { ReviewCliReproduceSection } from "@/components/reviews/ReviewCliReproduceSection";
import { RunAgentForensicsSection } from "@/components/RunAgentForensicsSection";
import { RunAgentQualityWarningsSection } from "@/components/RunAgentQualityWarningsSection";
import { BUYER_REVIEW_DETAIL_POLICY_PACK_NOTE } from "@/lib/buyer-polish-copy";

import { RunDetailAdvancedAnalysisSection } from "./RunDetailAdvancedAnalysisSection";
import { RunDetailManifestSummaryAlerts } from "./RunDetailManifestSummaryAlerts";
import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";
import { RunDetailOperatorTechnicalFooter } from "./RunDetailOperatorTechnicalFooter";
import { RunDetailPipelineTimelineSection } from "./RunDetailPipelineTimelineSection";
import { RunDetailPipelineStagesSection } from "./RunDetailPipelineStagesSection";
import { RunDetailPreFinalizedEmptyState } from "./RunDetailPreFinalizedEmptyState";
import { RunDetailProvenanceSummaryCard } from "./RunDetailProvenanceSummaryCard";
import { RunDetailRunActionsSection } from "./RunDetailRunActionsSection";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import { RunDetailExplanationSkeleton } from "./RunDetailDeferredSkeleton";
import { loadRunDetailBelowFoldDeferredModel } from "./load-run-detail-deferred-model";
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
  /** Tabbed buyer workspace renders deliverables on the Evidence tab — skip duplicate anchor here. */
  readonly skipArtifactsExports?: boolean;
};

/** Streams pipeline, graph, and technical appendices after first-screen run detail chrome. */
export async function RunDetailBelowFoldSections(
  props: RunDetailBelowFoldSectionsProps,
): Promise<React.JSX.Element> {
  const m = props.model;
  const deferred = await loadRunDetailBelowFoldDeferredModel(props.context);
  const findingCoverageSummary = m.resolvedDetail.findingCoverageSummary ?? null;

  return (
    <>
      {!m.buyerPolishedArtifactTable && m.manifestId ? (
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

      <RunDetailPipelineTimelineSection
        runId={m.routeRunId}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        pipelineTimelineFailure={deferred.pipelineTimelineFailure}
        pipelineTimelineForUi={deferred.pipelineTimelineForUi}
      />

      <RunDetailPipelineStagesSection
        stageTimeline={deferred.stageTimelineForUi}
        otelTraceId={m.resolvedDetail.run.otelTraceId ?? m.runDetailTraceId}
      />

      {m.resolvedDetail.run.graphSnapshotId ? (
        <RunDetailArchitectureGraphSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
          anchorRunCreatedUtc={m.resolvedDetail.run.createdUtc}
          graphHistoryMinCreatedUtc={deferred.architectureGraphTemporalMinUtc}
          disableTemporalBrowsing={m.usedStaticDemoRun}
        />
      ) : null}

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

      <RunDetailManifestSummaryAlerts
        manifestSummaryFailure={m.manifestSummaryFailure}
        manifestSummaryMalformed={m.manifestSummaryMalformed}
      />

      {m.manifestId ? (
        <>
          <RunDetailWhatsNextSection runId={m.routeRunId} />
          <RecurrenceSchedulePostCommitCard
            runId={m.routeRunId}
            hasStickinessPrompt={Boolean(m.manifestId)}
          />
          <PostCommitHabitLoopCard
            runId={m.routeRunId}
            showCompareCta={deferred.canShowCompareReviewButton}
            buyerShowcaseQuickLinks={m.usedStaticDemoRun}
            goldenManifestId={m.manifestId}
          />
        </>
      ) : null}

      {m.manifestId && props.skipArtifactsExports !== true ? (
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
          samplePolicyPackContextLine={
            m.usedStaticDemoRun === true
              ? m.buyerPolishedArtifactTable === true
                ? BUYER_REVIEW_DETAIL_POLICY_PACK_NOTE
                : "Policy pack used for this sample review."
              : null
          }
          requestId={m.resolvedDetail.run.architectureRequestId ?? (m.resolvedDetail.run as { requestId?: string }).requestId}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable && m.manifestId ? (
        <RunDetailRetrievalGroundingSection
          runId={m.routeRunId}
          showWhenFaithfulnessWarning={
            typeof m.explanationSummary?.faithfulnessWarning === "string"
            && m.explanationSummary.faithfulnessWarning.trim().length > 0
          }
        />
      ) : null}

      {m.manifestId && !m.buyerPolishedArtifactTable ? (
        <BeforeAfterDeltaPanel variant="inline" runId={m.routeRunId} />
      ) : null}

      {m.manifestId ? (
        <RunDetailAdvancedAnalysisSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? <RunAgentQualityWarningsSection runId={m.routeRunId} /> : null}

      {!m.buyerPolishedArtifactTable ? <RunAgentForensicsSection runId={m.routeRunId} /> : null}

      {!m.buyerPolishedArtifactTable ? (
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
