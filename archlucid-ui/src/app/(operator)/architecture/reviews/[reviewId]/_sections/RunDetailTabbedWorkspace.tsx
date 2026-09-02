import { Suspense } from "react";

import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import { resolveReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";

import {
  RecurrenceSchedulePostCommitCardDeferred,
  ReviewDetailWorkspaceDeferred,
  RunDetailArchitectureGraphIsland,
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailExplanationDeferred,
  RunDetailExplanationSkeleton,
  RunDetailGenerateAdrFromRunModal,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailManifestSummaryAlertsDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailPackageChangesSinceFinalizeSection,
  RunDetailPackageChangesSinceFinalizeSkeleton,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailPostCommitHabitIsland,
  RunDetailReviewPackageSectionDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
  RunDetailRunActionsSectionDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailTabbedSectionNavDeferred,
  RunDetailTechnologyBaselineSection,
  resolveRunDetailSponsorBriefingSection,
} from "./RunDetailTabbedWorkspaceDeferredImports";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import { ReviewInPipelineBanner } from "@/components/reviews/ReviewInPipelineBanner";
import { reviewPipelineDiagnosticContextFromRunDetail } from "@/lib/review-pipeline-diagnostic-context";
import type { RunDetailPageModel } from "./run-detail-page-model";
import { composeRunDetailEvidenceTab } from "./RunDetailEvidenceTabComposition";
import { composeRunDetailGovernanceTab } from "./RunDetailGovernanceTabComposition";
import {
  buildRunDetailOutcomeCards,
  composeRunDetailOverviewTab,
} from "./RunDetailOverviewTabComposition";
import { composeRunDetailActivityTab } from "./RunDetailActivityTabComposition";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

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
    blockingApprovalCount,
    deferredContext,
    evidenceInventoryCount,
    findingCoverageSummary,
    pendingDecisionCount,
    quickDecisionFindings,
    reviewPolicyPackCallout,
    reviewStatusSummary,
    showArchitectureCreatedHome,
    showDemoMarketingChrome,
    submittedArchitectureText,
    requestAssumptionTexts,
    lowExtractionConfidenceCount,
  } = p;

  const outcomeCardsEl = buildRunDetailOutcomeCards(m, p);
  const overviewTabPanelEl = composeRunDetailOverviewTab({
    model: m,
    presentation: p,
    outcomeCardsEl,
  });

  const sampleReviewPackageSummaryEl =
    m.usedStaticDemoRun ? (
      <RunDetailSampleReviewPackageSummaryDeferred
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        artifactCount={m.artifacts.length}
        findingCount={m.findingCountDisplay}
      />
    ) : null;

  const evidenceTabPanelEl = composeRunDetailEvidenceTab({ model: m, presentation: p });
  const governanceTabPanelEl = composeRunDetailGovernanceTab({ model: m, presentation: p });
  const activityTabPanelEl = composeRunDetailActivityTab({
    model: m,
    deferredContext,
  });

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
    <ReviewInPipelineBanner
      runId={m.resolvedDetail.run.runId}
      initialSummary={m.progressForPipelineUi}
      diagnosticContext={reviewPipelineDiagnosticContextFromRunDetail(m.resolvedDetail.run)}
    />
  ) : null;

  return (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <ReviewDetailWorkspaceDeferred
        runId={m.resolvedDetail.run.runId}
        tabSectionNav={
          <RunDetailTabbedSectionNavDeferred
            runId={m.resolvedDetail.run.runId}
            sections={m.runDetailNavSections}
          />
        }
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
          overview: overviewTabPanelEl,
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
                  architectureRequestId={m.resolvedDetail.run.architectureRequestId}
                  effectiveGovernanceAtCommit={reviewPolicyPackCallout.effectiveGovernanceAtCommit}
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
          decisionsRemediation: governanceTabPanelEl,
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
              {resolveRunDetailSponsorBriefingSection(m, { pagePrimaryOwnedElsewhere: true })}
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
                  isArchived={m.resolvedDetail.run.isArchived === true}
                />
              ) : null}
            </div>
          ),
          architecture: architectureTabPanelEl,
          activity: activityTabPanelEl,
        }}
      />
    </Suspense>
  );
}
