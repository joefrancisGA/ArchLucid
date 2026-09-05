import Link from "next/link";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import { resolveReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";
import { RunDetailActivityTabSectionNav } from "@/components/runs/RunDetailActivityTabSectionNav";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { ReviewInPipelineBanner } from "@/components/reviews/ReviewInPipelineBanner";
import { RunDetailInFlightDeskChrome } from "@/components/reviews/RunDetailInFlightDeskChrome";
import { ReviewDefensibilityStrip } from "@/components/reviews/ReviewDefensibilityStrip";
import { reviewPipelineDiagnosticContextFromRunDetail } from "@/lib/review-pipeline-diagnostic-context";
import { buildReviewDefensibilityStripProps } from "@/lib/reviews/build-review-defensibility-strip-props";
import { RunDetailInfeasibleDecisionLead } from "./RunDetailInfeasibleDecisionLead";
import { composeRunDetailTabbedWorkspaceEvidenceShell } from "./RunDetailTabbedWorkspaceEvidenceShell";
import { composeRunDetailTabbedWorkspaceGovernanceShell } from "./RunDetailTabbedWorkspaceGovernanceShell";
import { composeRunDetailTabbedWorkspaceOverviewShell } from "./RunDetailTabbedWorkspaceOverviewShell";
import { composeRunDetailActivityTab } from "./RunDetailActivityTabComposition";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";
import {
  RecurrenceSchedulePostCommitCardDeferred,
  RunDetailArchitectureGraphIsland,
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailBelowFoldSectionsDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailExplanationDeferred,
  RunDetailGenerateAdrFromRunModal,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailManifestSummaryAlertsDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailPackageChangesSinceFinalizeSection,
  RunDetailPackageChangesSinceFinalizeSkeleton,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailPostCommitHabitIsland,
  RunDetailProgressTrackerDeferred,
  RunDetailReviewPackageSectionDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
  RunDetailRunActionsSectionDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailTechnologyBaselineSection,
  resolveRunDetailSponsorBriefingSection,
} from "./RunDetailTabbedWorkspaceDeferredImports";

export type RunDetailTabbedWorkspaceResolved = {
  readonly inPipelineBannerEl: React.JSX.Element | null;
  readonly defensibilityStripEl: React.JSX.Element | null;
  readonly lifecycle: ReturnType<typeof resolveReviewWorkspaceLifecycle>;
  readonly tabActivityAt: ReturnType<typeof deriveReviewDetailTabActivityAt>;
  readonly tabCounts: {
    readonly findings: number | null;
    readonly evidence: number | null;
    readonly decisionsRemediation: number | null;
  };
  readonly panels: {
    readonly overview: React.JSX.Element;
    readonly findings: React.JSX.Element;
    readonly evidence: React.JSX.Element;
    readonly policies: React.JSX.Element;
    readonly decisionsRemediation: React.JSX.Element;
    readonly reviewPackage: React.JSX.Element;
    readonly architecture: React.JSX.Element;
    readonly activity: React.JSX.Element;
  };
};

/** Resolves tab panels and workspace chrome props for the tabbed run-detail workspace. */
export function resolveRunDetailTabbedWorkspace(
  model: RunDetailPageModel,
  presentation: RunDetailPresentation,
): RunDetailTabbedWorkspaceResolved | null {
  const m = model;
  const p = presentation;
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

  if (showArchitectureCreatedHome) {
    return null;
  }

  const overviewPanelEl = composeRunDetailTabbedWorkspaceOverviewShell({ model: m, presentation: p });
  const evidenceTabPanelEl = composeRunDetailTabbedWorkspaceEvidenceShell({ model: m, presentation: p });
  const governanceTabPanelEl = composeRunDetailTabbedWorkspaceGovernanceShell({ model: m, presentation: p });

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

  const sampleReviewPackageSummaryEl =
    m.usedStaticDemoRun ? (
      <RunDetailSampleReviewPackageSummaryDeferred
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        artifactCount={m.artifacts.length}
        findingCount={m.findingCountDisplay}
      />
    ) : null;

  const inPipelineBannerEl = m.showProgressTracker ? (
    <RunDetailInFlightDeskChrome
      runId={m.resolvedDetail.run.runId}
      pipelineBanner={
        <ReviewInPipelineBanner
          runId={m.resolvedDetail.run.runId}
          initialSummary={m.progressForPipelineUi}
          diagnosticContext={reviewPipelineDiagnosticContextFromRunDetail(m.resolvedDetail.run)}
        />
      }
    />
  ) : null;

  const defensibilityStripProps = buildReviewDefensibilityStripProps(
    m.manifestSummaryForUi?.feasibilityVerdict ?? m.manifestSummary?.feasibilityVerdict,
    m.showProgressTracker && m.resolvedDetail.run.completedUtc === null,
  );
  const defensibilityStripEl =
    defensibilityStripProps !== null ? <ReviewDefensibilityStrip {...defensibilityStripProps} /> : null;

  return {
    inPipelineBannerEl,
    defensibilityStripEl,
    lifecycle: resolveReviewWorkspaceLifecycle({
      manifestId: m.manifestId,
      showProgressTracker: m.showProgressTracker,
      runCompleted: m.resolvedDetail.run.completedUtc != null,
    }),
    tabActivityAt: deriveReviewDetailTabActivityAt({
      run: m.resolvedDetail.run,
      manifestSummary: m.manifestSummary,
      manifestId: m.manifestId,
      findings: quickDecisionFindings,
      operatorGovernanceDecisionUtc: m.resolvedDetail.run.operatorGovernanceDecisionUtc,
    }),
    tabCounts: {
      findings: (m.findingCountDisplay ?? 0) > 0 ? m.findingCountDisplay : null,
      evidence: evidenceInventoryCount > 0 ? evidenceInventoryCount : null,
      decisionsRemediation: pendingDecisionCount > 0 ? pendingDecisionCount : null,
    },
    panels: {
      overview: overviewPanelEl,
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
          <RunDetailInfeasibleDecisionLead
            feasibilityVerdict={m.manifestSummaryForUi?.feasibilityVerdict ?? m.manifestSummary?.feasibilityVerdict ?? null}
            runId={m.resolvedDetail.run.runId}
          />
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
              pipelineInFlight={m.showProgressTracker && !m.manifestId}
            />
          ) : null}
        </div>
      ),
      architecture: architectureTabPanelEl,
      activity: composeRunDetailActivityTab({ model: m, deferredContext }),
    },
  };
}
