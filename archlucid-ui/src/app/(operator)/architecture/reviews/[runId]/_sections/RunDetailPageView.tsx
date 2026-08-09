import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { HelpPageSituationRegistrar } from "@/components/help/HelpPageSituationRegistrar";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import { PersistentSponsorEmailStrip } from "@/components/usability/PersistentSponsorEmailStrip";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer-demo-content-gating";
import { isBuyerGoldenReviewPackagePageReady } from "@/lib/buyer-golden-spine-run-id";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/run-detail-governance-cta-visibility";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";

import { ReviewSealedIndicatorChip } from "@/components/reviews/ReviewSealedIndicatorChip";
import { ReviewGenerationCreatedNotice } from "@/components/review-intake/ReviewGenerationCreatedNotice";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture-created-home-model";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import {
  humanReviewStatusDisplay,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import {
  countFindingsBySeverity,
  deriveArchitectureSystemName,
  deriveBlockingApprovalCount,
  deriveExecutiveBottomLineContent,
  deriveHighestFindingSeverityLabel,
  deriveLastEvaluatedLabel,
  deriveOverallPostureLabel,
  deriveRecommendedWorkspaceActions,
  deriveReviewDisplayTitle,
  deriveReviewOwnerLabel,
  deriveReviewStatusSummary,
  deriveReviewTemplateLabel,
  deriveRunDetailWorkspaceStatus,
  deriveSubmittedArchitectureText,
  formatDecisionSnapshotFindingsLine,
  formatDecisionSnapshotGovernanceOutcome,
} from "@/lib/run-detail-workspace-derive";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { resolvePartialRunCommitBlockedReason } from "@/lib/run-detail-partial-run-commit-block";

import { resolveReviewPackagePrimaryAction } from "./resolve-review-package-primary-action";
import {
  RunDetailWorkspaceDisclosureControls,
  RunDetailWorkspaceDisclosureProvider,
  RunDetailWorkspaceLayout,
} from "./RunDetailWorkspaceShell";
import { RunDetailDeferredScopeNoticeClient } from "@/components/reviews/RunDetailDeferredScopeNoticeClient";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import {
  RunDetailBuyerModeFallbackBannerDeferred,
  RunDetailBuyerPilotConversionSectionDeferred,
  RunDetailCaptureEvidenceSectionDeferred,
  RunDetailExecutiveBottomLineDeferred,
  RunDetailExecutiveSummaryCtaCardDeferred,
  RunDetailGovernanceCtaDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailReviewPackageSectionDeferred,
  RunDetailSectionNavDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailWorkspaceHeaderDeferred,
  RunDetailWorkspaceStickyActionsDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
  ReviewPackagePrimaryActionDeferred,
  ReviewPackageSponsorHandoffStripDeferred,
  RunDetailArchitectureCreateWorkItemSectionDeferred,
  RunDetailArchitectureCreatedWorkspaceDeferred,
  RunDetailArchitectureSponsorSharingPanelDeferred,
  RunDetailArtifactsExportsSectionDeferred,
  RunDetailCommitBlockingFindingsBannerDeferred,
  RunDetailCompareToBaselineCta,
  RunDetailCtoDemoReviewRouteGuardDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailExportDeliverableDialog,
  RunDetailFirstWeekRouteGuidanceDeferred,
  RunDetailGenerateAdrFromRunModal,
  RunDetailGovernanceAlertsDeferred,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailLastFailureCardDeferred,
  RunDetailOperatorTechnicalForensicsPanelDeferred,
  RunDetailOutcomeCardsDeferred,
  RunDetailPolicyPackImpactCalloutDeferred,
  RunDetailProgressTrackerDeferred,
  RunDetailSampleReviewPackageSummaryDeferred,
  RunDetailStalledReviewGuidanceCalloutDeferred,
  RunDetailTechnologyBaselineSection,
  RunDetailTrustEvidenceCardSectionDeferred,
  RunDetailWhatIfBranchCompareBannerDeferred,
  ReviewDetailWorkspaceDeferred,
  RunDetailOverviewPanelClientDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailBelowFoldSections } from "./RunDetailBelowFoldSections";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailExplanationSkeleton,
  RunDetailMidDeferredSkeleton,
} from "./RunDetailDeferredSkeleton";
import { RunDetailDecisionDeltaDeferred } from "./RunDetailDecisionDeltaDeferred";
import { RunDetailDecisionDeltaSkeleton } from "./RunDetailDecisionDeltaSkeleton";
import { RunDetailExplanationDeferred } from "./RunDetailExplanationDeferred";
import type { RunDetailDeferredSectionContext, RunDetailPageModel } from "./run-detail-page-model";

function toDeferredSectionContext(model: RunDetailPageModel): RunDetailDeferredSectionContext {
  return {
    routeRunId: model.routeRunId,
    resolvedDetail: model.resolvedDetail,
    usedStaticDemoRun: model.usedStaticDemoRun,
    buyerPolishedArtifactTable: model.buyerPolishedArtifactTable,
    manifestId: model.manifestId,
    artifacts: model.artifacts,
  };
}

/** Server component: renders the main run detail chrome from a preloaded `RunDetailPageModel`. */
export function RunDetailPageView(props: {
  readonly model: RunDetailPageModel;
  readonly fromArchitectureCreation?: boolean;
}): React.JSX.Element {
  const m = props.model;
  const deferredContext = toDeferredSectionContext(m);
  const runSummaryForBadge = m.progressForPipelineUi;

  const sampleReviewPackageSummaryEl =
    m.usedStaticDemoRun ? (
      <RunDetailSampleReviewPackageSummaryDeferred
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        artifactCount={m.artifacts.length}
        findingCount={m.findingCountDisplay}
      />
    ) : null;

  const showcasePolicyPackStrip =
    m.buyerPolishedArtifactTable &&
    m.manifestSummaryForUi !== null &&
    isShowcaseStaticDemoRunId(m.resolvedDetail.run.runId)
      ? {
          href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
          label: policyPackBuyerLabel(m.manifestSummaryForUi.ruleSetId, m.manifestSummaryForUi.ruleSetVersion),
        }
      : null;
  const findingCoverageSummary = m.resolvedDetail.findingCoverageSummary ?? null;
  const findingCoverageCommitBlockedReason =
    findingCoverageSummary?.hasCommitBlockingFailures === true
      ? m.buyerPolishedArtifactTable === true
        ? "Some checks must finish before this review can be finalized."
        : `Finding coverage is commit-blocking. Failed engines: ${
            findingCoverageSummary.failedEngineLabels?.length
              ? findingCoverageSummary.failedEngineLabels.join(", ")
              : "one or more required finding engines"
          }.`
      : null;
  const commitBlockedReason =
    findingCoverageCommitBlockedReason ??
    resolvePartialRunCommitBlockedReason({
      legacyRunStatus: m.resolvedDetail.run.legacyRunStatus ?? null,
      agentExecutionOutcomes: m.resolvedDetail.agentExecutionOutcomes ?? null,
      findingCoverageAlreadyBlocking: false,
    });

  const governanceAlertsEl = (
    <GovernanceModePresentationGate>
      <>
        <RunDetailGovernanceAlertsDeferred
          run={m.resolvedDetail.run}
          hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
        />
        <RunDetailDeferredScopeNoticeClient />
      </>
    </GovernanceModePresentationGate>
  );

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

  const buyerFinalizedPackage =
    m.buyerPolishedArtifactTable === true && Boolean(m.manifestId);
  const blockingFindingCount = m.manifestSummary?.unresolvedIssueCount ?? 0;

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
      />
    ) : null;

  const sectionNavEl = <RunDetailSectionNavDeferred sections={m.runDetailNavSections} />;

  const showDemoMarketingChrome = shouldShowOperatorDemoMarketingChrome(
    m.buyerPolishedArtifactTable === true,
    m.usedStaticDemoRun,
  );

  const reviewPolicyPackCallout =
    m.manifestSummaryForUi !== null && m.manifestId
      ? {
          ruleSetId: m.manifestSummaryForUi.ruleSetId,
          ruleSetVersion: m.manifestSummaryForUi.ruleSetVersion,
        }
      : null;

  const governanceCtaEl = shouldShowRunDetailGovernanceCta({
    manifestId: m.manifestId,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: m.manifestSummary?.status ?? null,
  }) ? (
    <RunDetailGovernanceCtaDeferred runId={m.resolvedDetail.run.runId} demoted />
  ) : null;

  const reviewPackagePrimaryAction = resolveReviewPackagePrimaryAction({
    runId: m.resolvedDetail.run.runId,
    manifestId: m.manifestId,
    hasCommitBlockingFailures: findingCoverageSummary?.hasCommitBlockingFailures === true,
    blockingFindingCount,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: m.manifestSummary?.status ?? null,
    runCompleted: m.resolvedDetail.run.completedUtc != null,
  });

  const skipDuplicateFindingsActions = reviewPackagePrimaryAction.kind === "review-findings";

  const showGovernanceCtaCard =
    governanceCtaEl !== null && reviewPackagePrimaryAction.kind !== "open-governance-decision";

  const buyerGoldenPageReady = isBuyerGoldenReviewPackagePageReady({
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    runId: m.resolvedDetail.run.runId,
    headline: m.headline,
    manifestId: m.manifestId,
  });

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(
    m.resolvedDetail,
    m.explanationSummary,
  );
  const severityCounts = countFindingsBySeverity(quickDecisionFindings);
  const reviewDisplayTitle = deriveReviewDisplayTitle(runSummaryForBadge, m.headline);
  const systemName = deriveArchitectureSystemName(runSummaryForBadge, reviewDisplayTitle);
  const highestSeverity = deriveHighestFindingSeverityLabel(
    quickDecisionFindings,
    m.explanationSummary?.riskPosture ?? null,
  );
  const overallPosture = deriveOverallPostureLabel(
    m.explanationSummary?.riskPosture,
    m.governanceGateLabel,
    highestSeverity,
  );
  const blockingApprovalCount = deriveBlockingApprovalCount({
    unresolvedIssueCount: m.manifestSummary?.unresolvedIssueCount,
    hasCommitBlockingFailures: findingCoverageSummary?.hasCommitBlockingFailures === true,
    findings: quickDecisionFindings,
  });
  const reviewPackagePrimaryActionContext = {
    runId: m.resolvedDetail.run.runId,
    manifestId: m.manifestId,
    hasCommitBlockingFailures: findingCoverageSummary?.hasCommitBlockingFailures === true,
    blockingFindingCount: blockingApprovalCount,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: m.manifestSummary?.status ?? null,
    runCompleted: m.resolvedDetail.run.completedUtc != null,
  };
  const workspaceStatus = deriveRunDetailWorkspaceStatus({
    run: m.resolvedDetail.run,
    manifestId: m.manifestId,
    manifestStatus: m.manifestSummary?.status ?? null,
    showProgressTracker: m.showProgressTracker,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    blockingFindingCount: blockingApprovalCount,
  });
  const evidenceGapsCount = quickDecisionFindings.filter((finding) => (finding.evidenceRefCount ?? 0) === 0).length;
  const evidenceCoverageComplete =
    evidenceGapsCount === 0 &&
    m.artifacts.length > 0 &&
    m.resolvedDetail.trustEvidenceCard !== null &&
    m.resolvedDetail.trustEvidenceCard !== undefined;
  const recommendedActions = deriveRecommendedWorkspaceActions({
    runId: m.resolvedDetail.run.runId,
    findings: quickDecisionFindings,
    manifestId: m.manifestId,
    showProgressTracker: m.showProgressTracker,
    hasCommitBlockingFailures: findingCoverageSummary?.hasCommitBlockingFailures === true,
    blockingFindingCount,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    manifestStatus: m.manifestSummary?.status ?? null,
    runCompleted: m.resolvedDetail.run.completedUtc != null,
    evidenceCoverageComplete,
    skipDuplicateFindingsActions,
  });
  const reviewStatusSummary = deriveReviewStatusSummary({
    reviewOutcome: overallPosture,
    findings: quickDecisionFindings,
    recommendedActions,
    blockingFindingCount: blockingApprovalCount,
  });
  const submittedArchitectureText = deriveSubmittedArchitectureText(runSummaryForBadge, reviewDisplayTitle);
  const hasSubmittedArchitecture = submittedArchitectureText !== null;
  const architectureSummaryTitle =
    systemName !== null && systemName !== reviewDisplayTitle ? systemName : null;
  const governanceDecisionLabel =
    (m.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0
      ? (m.resolvedDetail.run.operatorGovernanceDecision ?? "").trim()
      : m.governanceGateLabel ?? "No governance decision recorded";
  const executiveBottomLineContent = deriveExecutiveBottomLineContent({
    governanceDecisionLabel,
    governanceDecisionRationale: m.resolvedDetail.run.operatorGovernanceDecisionRationale,
    overallPosture,
    blockingFindingCount: blockingApprovalCount,
    highestSeverity,
    themeSummaries: m.explanationSummary?.themeSummaries ?? null,
  });
  const executiveBottomLineEl =
    blockingApprovalCount === 0 ? (
      <RunDetailExecutiveBottomLineDeferred content={executiveBottomLineContent} />
    ) : null;
  const findingsTabHref = buildReviewDetailTabHref(m.resolvedDetail.run.runId, "findings");
  const materialSeverityLine =
    severityCounts.critical + severityCounts.high > 0
      ? `${severityCounts.critical} critical · ${severityCounts.high} high`
      : null;

  const showArchitectureCreatedHome =
    props.fromArchitectureCreation === true && (m.manifestId ?? "").trim().length === 0;
  const lastEvaluatedUtc = deriveLastEvaluatedLabel(m.resolvedDetail.run, m.manifestSummary);
  const pendingDecisionCount = quickDecisionFindings.filter((finding) => {
    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    return status?.label === "Pending review";
  }).length;
  const architectureEditHref =
    !m.manifestId
      ? `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(m.resolvedDetail.run.runId)}`
      : null;
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
  const tabbedWorkspaceEl = !showArchitectureCreatedHome ? (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <ReviewDetailWorkspaceDeferred
        tabCounts={{
          findings: (m.findingCountDisplay ?? 0) > 0 ? m.findingCountDisplay : null,
          evidence: m.artifacts.length > 0 ? m.artifacts.length : null,
          decisionsRemediation: pendingDecisionCount > 0 ? pendingDecisionCount : null,
        }}
        panels={{
          overview: (
            <RunDetailOverviewPanelClientDeferred
              runId={m.resolvedDetail.run.runId}
              architectureTitle={architectureSummaryTitle}
              architectureText={submittedArchitectureText}
              evidenceCount={m.artifacts.length}
              hasSubmittedArchitecture={hasSubmittedArchitecture}
              userAssertions={null}
              recommendedActions={recommendedActions}
              criticalCount={severityCounts.critical}
              highCount={severityCounts.high}
              proofStatusSlot={<RunDetailFirstScreenProofStatusClient runId={m.resolvedDetail.run.runId} />}
            />
          ),
          findings: (
            <>
              {m.explanationSummary !== null ? (
                <RunDetailExplanationConfidenceBannerDeferred summary={m.explanationSummary} />
              ) : null}
              {explanationDeferredEl}
            </>
          ),
          evidence: (
            <div className="space-y-4">
              {!m.manifestId ? (
                <RunDetailCaptureEvidenceSectionDeferred
                  runId={m.resolvedDetail.run.runId}
                  buyerPolished={m.buyerPolishedArtifactTable ?? false}
                />
              ) : null}
              {m.manifestId && m.resolvedDetail.trustEvidenceCard ? (
                <RunDetailTrustEvidenceCardSectionDeferred
                  card={m.resolvedDetail.trustEvidenceCard}
                  evidenceAskRunId={m.buyerPolishedArtifactTable ? m.resolvedDetail.run.runId : null}
                />
              ) : null}
              {artifactsExportsSectionEl}
            </div>
          ),
          policies: (
            <div className="space-y-4">
              {reviewPolicyPackCallout !== null ? (
                <RunDetailPolicyPackImpactCalloutDeferred
                  ruleSetId={reviewPolicyPackCallout.ruleSetId}
                  ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
                  runId={m.resolvedDetail.run.runId}
                  totalFindingCount={m.findingCountDisplay}
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
            </div>
          ),
          reviewPackage: (
            <div className="space-y-4">
              <RunDetailReviewPackageSectionDeferred
                manifestId={m.manifestId}
                runId={m.resolvedDetail.run.runId}
                artifactCount={m.artifacts.length}
                findingCount={m.findingCountDisplay}
                showExportActions={Boolean(m.manifestId) && !m.usedStaticDemoRun}
              />
              {m.manifestId ? (
                <PersistentSponsorEmailStrip runId={m.resolvedDetail.run.runId} isCommitted />
              ) : null}
              {m.manifestId ? (
                <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                  <RunDetailExportDeliverableDialog runId={m.resolvedDetail.run.runId} manifestId={m.manifestId} />
                  <ShareableReviewLinkButton runId={m.resolvedDetail.run.runId} isCommitted />
                  {m.resolvedDetail.run.completedUtc ? (
                    <ReviewSealedIndicatorChip sealedUtc={m.resolvedDetail.run.completedUtc} />
                  ) : null}
                </div>
              ) : null}
              {showDemoMarketingChrome ? sampleReviewPackageSummaryEl : null}
            </div>
          ),
          architecture: submittedArchitectureTabEl,
          activity: (
            <div className="space-y-4">
              {!m.manifestId && m.showProgressTracker ? (
                <div id="pipeline-timeline" className="scroll-mt-24">
                  <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
                </div>
              ) : null}
              {m.showProgressTracker && m.manifestId ? (
                <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
              ) : null}
              <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                <summary className="cursor-pointer font-semibold">Technology baseline</summary>
                <div className="mt-3">
                  <RunDetailTechnologyBaselineSection
                    runId={m.resolvedDetail.run.runId}
                    manifestFinalized={Boolean(m.manifestId)}
                    buyerPolished={m.buyerPolishedArtifactTable ?? false}
                    usedStaticDemoRun={m.usedStaticDemoRun}
                    warningCountDisplay={m.warningCountDisplay ?? 0}
                  />
                </div>
              </details>
              <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
                <div className="mt-3">{outcomeCardsEl}</div>
              </details>
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
              <RunDetailLastFailureCardDeferred
                summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
                legacyRunStatus={
                  (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
                }
              />
              {buyerFinalizedPackage ? null : (
                <RunDetailExecutiveSummaryCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
              )}
              {!m.buyerPolishedArtifactTable ? (
                <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                  <RunDetailGenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
                </div>
              ) : null}
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
              ) : null}
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
              {/* Outside below-fold deferred await — sponsor CTA must mount with the Activity tab. */}
              {resolveRunDetailSponsorBriefingSection(m)}
              <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
                <RunDetailBelowFoldSections
                  model={m}
                  context={deferredContext}
                  skipArtifactsExports={buyerFinalizedPackage}
                />
              </Suspense>
            </div>
          ),
        }}
      />
    </Suspense>
  ) : null;
  const architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput = {
    runId: m.resolvedDetail.run.runId,
    architectureName: systemName ?? reviewDisplayTitle,
    architectureOverview: submittedArchitectureText ?? "",
    businessOutcome: "",
    peopleAndSystems: [],
    ownerLabel: deriveReviewOwnerLabel(m.resolvedDetail.run),
    lastUpdatedLabel:
      lastEvaluatedUtc !== null ? formatInstantForLocale(lastEvaluatedUtc) : "just now",
    workspaceStatus,
    assessmentInProgress: m.showProgressTracker,
    hasArtifacts: m.artifacts.length > 0,
  };

  const runDetailBody = (
    <div
      className={cn(
        OPERATOR_PAGE_CONTAINER.base,
        OPERATOR_PAGE_CONTAINER.variant.dashboard,
        OPERATOR_LAYOUT.sectionStack,
        "px-1 py-2 sm:px-0",
      )}
    >
      <RunDetailCtoDemoReviewRouteGuardDeferred runId={m.resolvedDetail.run.runId} />

      <HelpPageSituationRegistrar
        situation={blockingApprovalCount > 0 ? "review-approval-blocked" : null}
      />

      {!showArchitectureCreatedHome ? (
        <Suspense fallback={null}>
          <ReviewGenerationCreatedNotice analysisInProgress={m.showProgressTracker} />
        </Suspense>
      ) : null}

      {showDemoMarketingChrome ? <OperatorDemoStaticBanner emphasizeSampleData={m.usedStaticDemoRun} /> : null}
      {m.usedStaticDemoRun && !showDemoMarketingChrome ? <DemoDataBadge variant="banner" className="mb-2" /> : null}

      <RunDetailWorkspaceDisclosureProvider>
        <RunDetailWorkspaceLayout
          stickyActions={null}
          main={
            <>
              {showArchitectureCreatedHome ? (
                <>
                  <RunDetailWorkspaceDisclosureControls />
                  <Suspense fallback={<RunDetailExplanationSkeleton />}>
                  <RunDetailArchitectureCreatedWorkspaceDeferred
                    baseline={architectureCreatedBaseline}
                    architectureSourceText={submittedArchitectureText ?? ""}
                    canEditDiagram={!m.manifestId}
                    findings={quickDecisionFindings}
                    correctionHref={
                      !m.manifestId
                        ? `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(m.resolvedDetail.run.runId)}`
                        : null
                    }
                    panels={{
                      findings: (
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
                          packageCommitted={Boolean(m.manifestId)}
                          providerNeutralWorkItems={Boolean(m.manifestId)}
                          architectureWorkItemContext={
                            m.manifestId
                              ? {
                                  architectureName: architectureCreatedBaseline.architectureName,
                                  architectureOverview: architectureCreatedBaseline.architectureOverview,
                                  ownerLabel: architectureCreatedBaseline.ownerLabel,
                                }
                              : null
                          }
                        />
                      ),
                      evidence: (
                        <RunDetailCaptureEvidenceSectionDeferred
                          runId={m.resolvedDetail.run.runId}
                          buyerPolished={m.buyerPolishedArtifactTable ?? false}
                        />
                      ),
                      governance: (
                        <>
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
                          />
                          {m.manifestId ? (
                            <>
                              <RunDetailArchitectureCreateWorkItemSectionDeferred
                                runId={m.resolvedDetail.run.runId}
                                architectureName={architectureCreatedBaseline.architectureName}
                                architectureOverview={architectureCreatedBaseline.architectureOverview}
                                ownerLabel={architectureCreatedBaseline.ownerLabel}
                                findings={quickDecisionFindings}
                              />
                              <RunDetailArchitectureSponsorSharingPanelDeferred
                                runId={m.resolvedDetail.run.runId}
                                architecture={architectureCreatedBaseline}
                                architectureSourceText={submittedArchitectureText ?? ""}
                                findings={quickDecisionFindings}
                              />
                            </>
                          ) : null}
                        </>
                      ),
                      activity: (
                        <div className="space-y-4">
{!m.manifestId && m.showProgressTracker ? (
                            <div id="architecture-assessment-progress" className="scroll-mt-24">
                              <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
                            </div>
                          ) : null}
                          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                            <summary className="cursor-pointer font-semibold">Technology baseline</summary>
                            <div className="mt-3">
                              <RunDetailTechnologyBaselineSection
                                runId={m.resolvedDetail.run.runId}
                                manifestFinalized={Boolean(m.manifestId)}
                                buyerPolished={m.buyerPolishedArtifactTable ?? false}
                                usedStaticDemoRun={m.usedStaticDemoRun}
                                warningCountDisplay={m.warningCountDisplay ?? 0}
                              />
                            </div>
                          </details>
                          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                            <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
                            <div className="mt-3">{outcomeCardsEl}</div>
                          </details>
                          <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                            <RunDetailMidDeferredSections context={deferredContext} />
                          </Suspense>
                        </div>
                      ),
                      submittedArchitecture: (
                        <RunDetailSubmittedArchitectureSectionDeferred
                          architectureText={submittedArchitectureText}
                          canEditSource={!m.manifestId}
                          editHref={
                            !m.manifestId
                              ? `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(m.resolvedDetail.run.runId)}`
                              : null
                          }
                          useStructuredPresentation={false}
                          runId={m.resolvedDetail.run.runId}
                          sectionTitle="Submitted brief"
                        />
                      ),
                    }}
                  />
                  </Suspense>
                </>
              ) : (
                <>
                  <RunDetailWorkspaceHeaderDeferred
                    runId={m.resolvedDetail.run.runId}
                    reviewTitle={reviewDisplayTitle}
                    systemName={systemName}
                    workspaceStatus={workspaceStatus}
                    reviewOwner={deriveReviewOwnerLabel(m.resolvedDetail.run)}
                    templateLabel={deriveReviewTemplateLabel(m.manifestSummaryForUi)}
                  />

                  <RunDetailWorkspaceSummaryStripDeferred
                    outcomeHeading={m.manifestId ? "Governance decision" : "Review posture"}
                    reviewOutcome={
                      m.manifestId
                        ? formatDecisionSnapshotGovernanceOutcome({
                            governanceDecisionLabel,
                            blockingFindingCount: blockingApprovalCount,
                          })
                        : reviewStatusSummary.reviewOutcome
                    }
                    highestUnresolvedSeverity={reviewStatusSummary.highestUnresolvedSeverity}
                    findingsSummaryLine={formatDecisionSnapshotFindingsLine(
                      reviewStatusSummary.openFindingsCount,
                      blockingApprovalCount,
                      reviewStatusSummary.findingsRequiringActionCount,
                    )}
                    primaryConcern={reviewStatusSummary.primaryConcern}
                    nextAction={reviewStatusSummary.nextAction}
                    materialSeverityLine={materialSeverityLine}
                    nextActionHref={blockingApprovalCount > 0 ? findingsTabHref : null}
                  />

                  <div className="hidden lg:block">
                    <RunDetailWorkspaceStickyActionsDeferred
                      runId={m.resolvedDetail.run.runId}
                      primaryAction={reviewPackagePrimaryAction}
                      primaryActionContext={reviewPackagePrimaryActionContext}
                      commitBlockedReason={commitBlockedReason}
                      showProgressTracker={m.showProgressTracker}
                      manifestId={m.manifestId}
                    />
                  </div>

                  <div className="lg:hidden">
                    <ReviewPackagePrimaryActionDeferred
                      action={reviewPackagePrimaryAction}
                      primaryActionContext={reviewPackagePrimaryActionContext}
                      runId={m.resolvedDetail.run.runId}
                      hasGoldenManifest={Boolean(m.manifestId)}
                      commitBlockedReason={commitBlockedReason}
                    />
                  </div>

                  {reviewPackagePrimaryAction.kind === "send-to-sponsor" && m.manifestId ? (
                    <ReviewPackageSponsorHandoffStripDeferred
                      runId={m.resolvedDetail.run.runId}
                      manifestId={m.manifestId}
                      goldenManifestJsonForExport={m.goldenManifestJsonForExport}
                      manifestSummary={m.manifestSummaryForUi ?? m.manifestSummary}
                      trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
                      usedStaticDemoRun={m.usedStaticDemoRun}
                      showExtendedSponsorBriefing={m.showPilotScorecardPackageCta}
                    />
                  ) : null}
                </>
              )}

              {!showArchitectureCreatedHome ? executiveBottomLineEl : null}

              {tabbedWorkspaceEl}

              {!m.manifestId ? (
                (() => {
                  const legacyStatus = m.resolvedDetail.run.legacyRunStatus;
                  const isDeadLettered = m.resolvedDetail.run.isDeadLettered === true;
                  const stalled = detectStalledReview(
                    m.resolvedDetail.run.createdUtc,
                    m.resolvedDetail.run.completedUtc != null
                      || legacyStatus === "Completed"
                      || legacyStatus === "Failed",
                    Date.now(),
                    isDeadLettered,
                  );

                  return stalled.isStalled ? (
                    <RunDetailStalledReviewGuidanceCalloutDeferred
                      elapsedMinutes={stalled.elapsedMinutes}
                      runId={m.resolvedDetail.run.runId}
                    />
                  ) : null;
                })()
              ) : null}

              {findingCoverageSummary?.hasCommitBlockingFailures === true && !showArchitectureCreatedHome ? (
                <RunDetailCommitBlockingFindingsBannerDeferred
                  runId={m.resolvedDetail.run.runId}
                  blockingFindings={[
                    {
                      findingId: "blocking-findings",
                      title: "Open blocking findings — review the Findings tab",
                    },
                  ]}
                />
              ) : null}
            </>
          }
          rail={null}
        />
      </RunDetailWorkspaceDisclosureProvider>

      {showArchitectureCreatedHome ? (
        <>
          {reviewPolicyPackCallout !== null ? (
            <RunDetailPolicyPackImpactCalloutDeferred
              ruleSetId={reviewPolicyPackCallout.ruleSetId}
              ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
              runId={m.resolvedDetail.run.runId}
              totalFindingCount={m.findingCountDisplay}
            />
          ) : null}
        </>
      ) : null}

      {blockingApprovalCount === 0 ? (
        <RunDetailFirstWeekRouteGuidanceDeferred
          variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
        />
      ) : null}

      {showArchitectureCreatedHome ? (
        <>
          <RunDetailTechnologyBaselineSection
            runId={m.resolvedDetail.run.runId}
            manifestFinalized={Boolean(m.manifestId)}
            buyerPolished={m.buyerPolishedArtifactTable ?? false}
            usedStaticDemoRun={m.usedStaticDemoRun}
            warningCountDisplay={m.warningCountDisplay ?? 0}
          />

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
            <PersistentSponsorEmailStrip runId={m.resolvedDetail.run.runId} isCommitted />
          ) : null}

          {m.manifestId ? (
            <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
              <RunDetailExportDeliverableDialog runId={m.resolvedDetail.run.runId} manifestId={m.manifestId} />
              <ShareableReviewLinkButton runId={m.resolvedDetail.run.runId} isCommitted />
              {m.resolvedDetail.run.completedUtc ? (
                <ReviewSealedIndicatorChip sealedUtc={m.resolvedDetail.run.completedUtc} />
              ) : null}
            </div>
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
            summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
            legacyRunStatus={
              (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
            }
          />

          {buyerFinalizedPackage ? null : (
            <RunDetailExecutiveSummaryCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
          )}

          {!m.buyerPolishedArtifactTable ? (
            <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
              <RunDetailGenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
            </div>
          ) : null}

          {!m.buyerPolishedArtifactTable ? (
            <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
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
            <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
          ) : null}

          {buyerFinalizedPackage ? null : sectionNavEl}

          {resolveRunDetailSponsorBriefingSection(m)}

          <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
            <RunDetailBelowFoldSections model={m} context={deferredContext} />
          </Suspense>
        </>
      ) : null}

      {governanceAlertsEl}

      {m.buyerPolishedArtifactTable ? (
        <RunDetailBuyerModeFallbackBannerDeferred
          realModeFellBackToSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
        />
      ) : null}

      <RunDetailBuyerPilotConversionSectionDeferred buyerPolishedArtifactTable={m.buyerPolishedArtifactTable} />
    </div>
  );

  return (
    <div
      data-testid="review-detail-root"
      data-buyer-golden-ready={buyerGoldenPageReady ? "true" : "false"}
    >
      {runDetailBody}
    </div>
  );
}
