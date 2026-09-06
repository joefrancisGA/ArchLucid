import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  resolveRunDetailReviewPackageInspectEmphasizedStepId,
  resolveRunDetailReviewPackageInspectSteps,
} from "@/lib/run-detail-review-package-inspect-checklist";

import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import {
  RunDetailCaptureEvidenceSectionDeferred,
  RunDetailCompareToBaselineCtaDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailGenerateAdrFromRunModal,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailProgressTrackerDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailSponsorReportCtaCardDeferred,
  RunDetailTrustEvidenceCardSectionDeferred,
  RunDetailWhatIfBranchCompareBannerDeferred,
  RunDetailPreFinalizeChecklistSection,
  RunDetailTechnologyBaselineSection,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailBelowFoldSectionsDeferred } from "./RunDetailBelowFoldSectionsDeferred";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailMidDeferredSkeleton,
} from "./RunDetailDeferredSkeleton";
import { RunDetailDecisionDeltaSkeleton } from "./RunDetailDecisionDeltaSkeleton";
import { RunDetailDecisionDeltaDeferred } from "./RunDetailDecisionDeltaDeferred";
import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";

export type RunDetailPageViewCommittedProps = {
  readonly model: RunDetailPageModel;
  readonly presentation: RunDetailPresentation;
  readonly governanceCtaEl: React.JSX.Element | null;
  readonly sectionNavEl: React.JSX.Element;
  readonly sampleReviewPackageSummaryEl: React.JSX.Element | null;
};

/** Below-fold create-home sections after architecture-created review detail. */
export function RunDetailPageViewCommitted(props: RunDetailPageViewCommittedProps): React.JSX.Element {
  const { model: m, presentation, governanceCtaEl, sectionNavEl, sampleReviewPackageSummaryEl } = props;
  const {
    buyerFinalizedPackage,
    deferredContext,
    reviewPolicyPackCallout,
    showDemoMarketingChrome,
    showGovernanceCtaCard,
  } = presentation;
  const runId = m.resolvedDetail.run.runId.trim();
  const reviewPackageInspectSteps = resolveRunDetailReviewPackageInspectSteps({
    reviewPicked: runId.length > 0,
    packageLoaded: Boolean(m.manifestId),
    findingsReviewed: (m.findingCountDisplay ?? 0) > 0,
  });
  const reviewPackageInspectEmphasizedStepId = resolveRunDetailReviewPackageInspectEmphasizedStepId({
    reviewPicked: runId.length > 0,
    packageLoaded: Boolean(m.manifestId),
    findingsReviewed: (m.findingCountDisplay ?? 0) > 0,
  });

  return (
    <>
      {m.buyerPolishedArtifactTable && m.manifestId ? (
        <IntegrationConnectChecklist
          title="Architecture package inspect checklist"
          steps={reviewPackageInspectSteps}
          emphasizedStepId={reviewPackageInspectEmphasizedStepId}
          testIdPrefix="run-detail-review-package"
        />
      ) : null}
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
        runId={m.resolvedDetail.run.runId}
        summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
        legacyRunStatus={(m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null}
      />

      {buyerFinalizedPackage ? null : (
        <RunDetailSponsorReportCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
      )}

      {!m.buyerPolishedArtifactTable ? (
        <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
          <RunDetailGenerateAdrFromRunModal
            input={m.adrGeneratorInput}
            totalFindingCount={m.careerExportEligibleFindingCount}
            buyerPolished={false}
          />
        </div>
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailCompareToBaselineCtaDeferred currentRunId={m.resolvedDetail.run.runId} />
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
  );
}
