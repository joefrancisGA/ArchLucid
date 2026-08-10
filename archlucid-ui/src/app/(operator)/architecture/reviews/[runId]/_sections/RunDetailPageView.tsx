import { Suspense } from "react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import { resolveRunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer-demo-content-gating";
import { isBuyerGoldenReviewPackagePageReady } from "@/lib/buyer-golden-spine-run-id";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/run-detail-governance-cta-visibility";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";

import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture-created-home-model";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture-created-home-model";
import { deriveArchitectureGapBaselineFromSubmittedText } from "@/lib/derive-architecture-gap-baseline";
import { deriveEvidencePresenceFromInventoryKinds } from "@/lib/evidence-gap-forecast";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import { deriveRunDetailFindingsTriageCounts } from "@/lib/run-detail-findings-triage-counts";
import {
  humanReviewStatusDisplay,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import { RunDetailActivityTabSectionNav } from "@/components/RunDetailActivityTabSectionNav";
import { resolvePartialRunCommitBlockPresentation } from "@/lib/run-detail-partial-run-commit-block";
import {
  countRunDetailEvidenceInventoryItems,
  deriveRunDetailEvidenceInventory,
} from "@/lib/run-detail-evidence-inventory";

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
  RunDetailDemoMarketingChromeDeferred,
  RunDetailEvidenceTabPanelDeferred,
  RunDetailExecutiveBottomLineDeferred,
  RunDetailExecutiveSummaryCtaCardDeferred,
  RunDetailGovernanceCtaDeferred,
  RunDetailGovernanceDecisionSectionDeferred,
  RunDetailManifestSummaryAlertsDeferred,
  RunDetailManifestSummarySectionDeferred,
  RunDetailReviewPackageSectionDeferred,
  RunDetailReviewPackageShareRowDeferred,
  RunDetailRunActionsSectionDeferred,
  RunDetailSectionNavDeferred,
  BeforeAfterDeltaPanelDeferred,
  RecurrenceSchedulePostCommitCardDeferred,
  RunDetailSubmittedArchitectureSectionDeferred,
  RunDetailActivitySourcesPanelDeferred,
  RunDetailCreateHomeEvidencePanelDeferred,
  RunDetailReviewPackageDoThisNextResolvedDeferred,
  RunDetailReviewPackageSponsorHandoffGateDeferred,
  RunDetailWorkspaceHeaderDeferred,
  RunDetailWorkspaceBlockingBannerDeferred,
  RunDetailWorkspaceSummaryStripDeferred,
  RunDetailArchitectureCreateWorkItemSectionDeferred,
  RunDetailArchitectureCreatedWorkspaceDeferred,
  RunDetailArchitectureSponsorSharingPanelDeferred,
  RunDetailArtifactsExportsSectionDeferred,
  RunDetailCommitBlockingFindingsBannerDeferred,
  RunDetailCompareToBaselineCta,
  RunDetailCtoDemoReviewRouteGuardDeferred,
  RunDetailExplanationConfidenceBannerDeferred,
  RunDetailFirstWeekRouteGuidanceDeferred,
  RunDetailColdOpenOrientationDeferred,
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
  HelpPageSituationRegistrarDeferred,
  ReviewGenerationCreatedNoticeDeferred,
  RunDetailBelowFoldSectionsDeferred,
} from "./run-detail-page-view-deferred-chunks";
import { resolveRunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import { buildBuyerReviewPackageDispositionLine } from "@/lib/review-buyer-disposition-line";
import { analysisStagesCompleteOnSummary } from "./pipeline-complete-on-summary";
import {
  RunDetailArchitectureGraphIsland,
  RunDetailPostCommitHabitIsland,
} from "./RunDetailTabbedDeferredIslands";
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
export async function RunDetailPageView(props: {
  readonly model: RunDetailPageModel;
  readonly fromArchitectureCreation?: boolean;
}): Promise<React.JSX.Element> {
  const {
    countFindingsBySeverity,
    deriveArchitectureSystemName,
    deriveBlockingApprovalCount,
    deriveEvidenceCoverageSummary,
    deriveExecutiveBottomLineContent,
    deriveHighestFindingSeverityLabel,
    derivePrimaryConcernFinding,
    derivePrimaryConcernLabel,
    deriveFinalizedAtUtc,
    deriveLastEvaluatedLabel,
    deriveOverallPostureLabel,
    derivePackageVersionLabel,
    deriveRecommendedWorkspaceActions,
    deriveReviewDisplayTitle,
    deriveReviewHeaderPresentation,
    deriveReviewOwnerLabel,
    deriveReviewStatusSummary,
    deriveReviewTemplateLabel,
    deriveRunDetailWorkspaceStatus,
    deriveSubmittedArchitectureText,
    formatDecisionSnapshotFindingsLine,
    formatDecisionSnapshotGovernanceOutcome,
  } = await import("@/lib/run-detail-workspace-derive");

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
  const partialRunCommitBlock =
    findingCoverageCommitBlockedReason === null
      ? resolvePartialRunCommitBlockPresentation({
          legacyRunStatus: m.resolvedDetail.run.legacyRunStatus ?? null,
          agentExecutionOutcomes: m.resolvedDetail.agentExecutionOutcomes ?? null,
          findingCoverageAlreadyBlocking: findingCoverageSummary?.hasCommitBlockingFailures === true,
        })
      : null;
  const commitBlockedReason =
    findingCoverageCommitBlockedReason ?? partialRunCommitBlock?.summary ?? null;
  const commitBlockedTechnicalDetail = partialRunCommitBlock?.technicalDetail ?? null;

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

  const createHomeActivityOutcomeCardsEl = (
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
      hidePromotedStatus
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
        deliverablesDefaultOpen={false}
      />
    ) : null;

  const sectionNavEl = (
    <RunDetailSectionNavDeferred runId={m.resolvedDetail.run.runId} sections={m.runDetailNavSections} />
  );

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
  const findingsTriageCounts = deriveRunDetailFindingsTriageCounts(quickDecisionFindings);
  const findingsTriageVisibleCount = findingsTriageCounts.triageVisibleCount;
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
  const skipDuplicateFindingsActions =
    findingCoverageSummary?.hasCommitBlockingFailures === true ||
    (Boolean(m.manifestId) && blockingApprovalCount > 0);
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
  const governanceWouldBePrimaryAction =
    Boolean(m.manifestId) &&
    !(findingCoverageSummary?.hasCommitBlockingFailures === true) &&
    blockingApprovalCount === 0 &&
    shouldShowRunDetailGovernanceCta({
      manifestId: m.manifestId,
      buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
      operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
      manifestStatus: m.manifestSummary?.status ?? null,
    });
  const showGovernanceCtaCard = governanceCtaEl !== null && !governanceWouldBePrimaryAction;
  const reviewHeaderPresentation = deriveReviewHeaderPresentation({
    reviewTitle: reviewDisplayTitle,
    systemName,
    runId: m.resolvedDetail.run.runId,
  });
  const evidenceCoverageSummary = deriveEvidenceCoverageSummary(quickDecisionFindings);
  const packageVersionLabel = derivePackageVersionLabel(m.manifestSummaryForUi ?? m.manifestSummary, m.manifestId);
  const finalizedAtUtc = deriveFinalizedAtUtc(
    m.resolvedDetail.run,
    m.manifestSummary,
    m.manifestId,
  );
  const finalizedAtLabel =
    finalizedAtUtc !== null ? formatInstantForLocale(finalizedAtUtc) : null;
  const submittedArchitectureText = deriveSubmittedArchitectureText(runSummaryForBadge, reviewDisplayTitle);
  const hasSubmittedArchitecture = submittedArchitectureText !== null;
  const evidenceInventoryItems = deriveRunDetailEvidenceInventory({
    findings: quickDecisionFindings,
    runCreatedUtc: m.resolvedDetail.run.createdUtc,
    submittedArchitecturePresent: hasSubmittedArchitecture,
  });
  const evidenceInventoryCount = countRunDetailEvidenceInventoryItems(evidenceInventoryItems);
  const evidencePresence = deriveEvidencePresenceFromInventoryKinds({
    inventoryKinds: evidenceInventoryItems.map((item) => item.kind),
    submittedArchitecturePresent: hasSubmittedArchitecture,
  });
  const evidenceReviewDateLabel =
    formatInstantForLocale(m.resolvedDetail.run.completedUtc ?? m.resolvedDetail.run.createdUtc) || m.createdLabel;
  const primaryConcernFinding = derivePrimaryConcernFinding(quickDecisionFindings);
  const evidenceTabPanelEl = (
    <RunDetailEvidenceTabPanelDeferred
      packageName={reviewDisplayTitle}
      reviewDateLabel={evidenceReviewDateLabel}
      evidenceItemCount={evidenceInventoryCount}
      deliverableCount={m.artifacts.length}
      evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
      linkedFindingCount={evidenceCoverageSummary.linkedCount}
      openFindingCount={evidenceCoverageSummary.totalCount}
      items={evidenceInventoryItems}
      runId={m.resolvedDetail.run.runId}
      manifestId={m.manifestId}
      buyerPolished={m.buyerPolishedArtifactTable ?? false}
      buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
      trustEvidenceCard={m.resolvedDetail.trustEvidenceCard}
      faithfulnessWarning={m.explanationSummary?.faithfulnessWarning ?? null}
      artifactsExportsSection={artifactsExportsSectionEl}
      blockingFindingId={primaryConcernFinding?.findingId ?? null}
      blockingFindingTitle={derivePrimaryConcernLabel(quickDecisionFindings)}
      approvalBlocked={blockingApprovalCount > 0}
    />
  );
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
  const materialSeverityLine =
    severityCounts.critical + severityCounts.high > 0
      ? `${severityCounts.critical} critical · ${severityCounts.high} high`
      : null;

  const showArchitectureCreatedHome =
    props.fromArchitectureCreation === true && (m.manifestId ?? "").trim().length === 0;
  const createHomeAnalysisStagesComplete = analysisStagesCompleteOnSummary(m.progressForPipelineUi);
  const createHomePreFinalizeReadyToFinalize = showArchitectureCreatedHome && createHomeAnalysisStagesComplete;
  const createHomeActivityStatusLine = buildBuyerReviewPackageDispositionLine({
    hasGoldenManifest: Boolean(m.manifestId),
    findingCountDisplay: m.findingCountDisplay,
    warningCountDisplay: m.warningCountDisplay,
    unresolvedIssueCountDisplay: m.manifestSummary?.unresolvedIssueCount ?? null,
    governanceGateLabel: m.governanceGateLabel,
    aggregateRiskPosture: m.explanationSummary?.riskPosture ?? null,
  });
  const createHomeActivityProvenanceAsOfLabel = formatInstantForLocale(
    m.resolvedDetail.run.completedUtc ?? m.resolvedDetail.run.createdUtc,
  );
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
  const tabbedWorkspaceEl = !showArchitectureCreatedHome ? (
    <Suspense fallback={<RunDetailExplanationSkeleton />}>
      <ReviewDetailWorkspaceDeferred
        runId={m.resolvedDetail.run.runId}
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
          overview: (
            <div className="space-y-4">
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
                proofStatusSlot={<RunDetailFirstScreenProofStatusClient runId={m.resolvedDetail.run.runId} />}
              />
              <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
                <div className="mt-3">{outcomeCardsEl}</div>
              </details>
              <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                <RunDetailMidDeferredSections context={deferredContext} />
              </Suspense>
              {buyerFinalizedPackage ? null : (
                <RunDetailExecutiveSummaryCtaCardDeferred runId={m.resolvedDetail.run.runId} demoted />
              )}
            </div>
          ),
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
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailCompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
              ) : null}
              {m.manifestId && !m.buyerPolishedArtifactTable ? (
                <BeforeAfterDeltaPanelDeferred variant="inline" runId={m.routeRunId} />
              ) : null}
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
                <RunDetailReviewPackageShareRowDeferred
                  runId={m.resolvedDetail.run.runId}
                  manifestId={m.manifestId}
                  completedUtc={m.resolvedDetail.run.completedUtc}
                />
              ) : null}
              {showDemoMarketingChrome ? sampleReviewPackageSummaryEl : null}
              {!m.buyerPolishedArtifactTable ? (
                <div className={cn("flex flex-wrap items-center", OPERATOR_LAYOUT.inlineGap)}>
                  <RunDetailGenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
                </div>
              ) : null}
              {resolveRunDetailSponsorBriefingSection(m)}
              {m.manifestId ? (
                <RunDetailPostCommitHabitIsland model={m} context={deferredContext} />
              ) : null}
              {m.manifestId ? (
                <RecurrenceSchedulePostCommitCardDeferred
                  runId={m.routeRunId}
                  hasStickinessPrompt={Boolean(m.manifestId)}
                />
              ) : null}
              {!m.buyerPolishedArtifactTable ? (
                <RunDetailRunActionsSectionDeferred
                  runId={m.resolvedDetail.run.runId}
                  systemName={m.resolvedDetail.run.description?.trim() || m.resolvedDetail.run.runId}
                  manifestId={m.manifestId}
                  hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                  operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision ?? null}
                />
              ) : null}
            </div>
          ),
          architecture: architectureTabPanelEl,
          activity: (
            <div className="space-y-4">
              <RunDetailActivityTabSectionNav />
              {!m.manifestId && m.showProgressTracker ? (
                <div id="pipeline-timeline" className="scroll-mt-24">
                  <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
                </div>
              ) : null}
              {m.showProgressTracker && m.manifestId ? (
                <RunDetailProgressTrackerDeferred runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
              ) : null}
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                <Link
                  className={OPERATOR_LINK.nav}
                  href={`/architecture/reviews/${encodeURIComponent(m.resolvedDetail.run.runId)}/provenance`}
                  data-testid="run-detail-provenance-link"
                >
                  Full provenance view
                </Link>
              </p>
              <RunDetailLastFailureCardDeferred
                summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
                legacyRunStatus={
                  (m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null
                }
              />
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
              <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
                <RunDetailBelowFoldSectionsDeferred
                  model={m}
                  context={deferredContext}
                  renderedInsideTabbedWorkspace
                />
              </Suspense>
            </div>
          ),
        }}
      />
    </Suspense>
  ) : null;
  const derivedGapBaseline = deriveArchitectureGapBaselineFromSubmittedText(submittedArchitectureText);
  const architectureCorrectionHref =
    !m.manifestId
      ? `/architecture/reviews/new?path=guided-intake&rerun=${encodeURIComponent(m.resolvedDetail.run.runId)}`
      : null;
  const architectureCreatedBaseline: BuildArchitectureCreatedHomeModelInput = {
    runId: m.resolvedDetail.run.runId,
    architectureName: systemName ?? reviewDisplayTitle,
    architectureOverview: submittedArchitectureText ?? "",
    businessOutcome: derivedGapBaseline.businessOutcome,
    peopleAndSystems: derivedGapBaseline.peopleAndSystems,
    ownerLabel: deriveReviewOwnerLabel(m.resolvedDetail.run),
    lastUpdatedLabel:
      lastEvaluatedUtc !== null ? formatInstantForLocale(lastEvaluatedUtc) : "just now",
    workspaceStatus,
    assessmentInProgress: m.showProgressTracker,
    hasArtifacts: m.artifacts.length > 0,
    correctionHref: architectureCorrectionHref,
    gapAssertion: derivedGapBaseline.gapAssertion,
    gapSourceCapturedAtUtc: null,
  };
  const architectureCreatedHomeModel = showArchitectureCreatedHome
    ? buildArchitectureCreatedHomeModel(architectureCreatedBaseline)
    : null;

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

      <HelpPageSituationRegistrarDeferred
        situation={blockingApprovalCount > 0 ? "review-approval-blocked" : null}
      />

      {!showArchitectureCreatedHome ? (
        <Suspense fallback={null}>
          <ReviewGenerationCreatedNoticeDeferred
            analysisInProgress={m.showProgressTracker}
            approvalBlocked={blockingApprovalCount > 0 || commitBlockedReason !== null}
            packageFinalized={Boolean(m.manifestId)}
          />
        </Suspense>
      ) : null}

      <RunDetailDemoMarketingChromeDeferred
        showMarketingBanner={showDemoMarketingChrome}
        showSampleBadge={m.usedStaticDemoRun && !showDemoMarketingChrome}
        emphasizeSampleData={m.usedStaticDemoRun}
      />

      <RunDetailWorkspaceDisclosureProvider>
        <RunDetailWorkspaceLayout
          stickyActions={null}
          main={
            <>
              {showArchitectureCreatedHome ? (
                <>
                  <RunDetailReviewPackageDoThisNextResolvedDeferred
                    runId={m.resolvedDetail.run.runId}
                    manifestId={m.manifestId}
                    hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                    blockingFindingCount={blockingApprovalCount}
                    buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                    operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
                    manifestStatus={m.manifestSummary?.status ?? null}
                    runCompleted={m.resolvedDetail.run.completedUtc != null}
                    nextAction={reviewStatusSummary.nextAction}
                    showProgressTracker={m.showProgressTracker}
                    openClarificationGapCount={architectureCreatedHomeModel?.clarificationGaps.length ?? 0}
                    correctionHref={architectureCorrectionHref}
                    useCreateHomeWorkspaceTabs
                    hasGoldenManifest={Boolean(m.manifestId)}
                    commitBlockedReason={commitBlockedReason}
                  />
                  <RunDetailWorkspaceDisclosureControls />
                  <Suspense fallback={<RunDetailExplanationSkeleton />}>
                  <RunDetailArchitectureCreatedWorkspaceDeferred
                    baseline={architectureCreatedBaseline}
                    architectureSourceText={submittedArchitectureText ?? ""}
                    canEditDiagram={!m.manifestId}
                    findings={quickDecisionFindings}
                    findingsTriageVisibleCount={findingsTriageVisibleCount}
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
                          analysisStagesComplete={createHomeAnalysisStagesComplete}
                          triageVisibleCount={findingsTriageVisibleCount}
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
                        <RunDetailCreateHomeEvidencePanelDeferred
                          packageName={reviewDisplayTitle}
                          reviewDateLabel={evidenceReviewDateLabel}
                          deliverableCount={m.artifacts.length}
                          evidenceCoverageSummaryLine={evidenceCoverageSummary.summaryLine}
                          linkedFindingCount={evidenceCoverageSummary.linkedCount}
                          openFindingCount={evidenceCoverageSummary.totalCount}
                          items={evidenceInventoryItems}
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
                        <div className="space-y-4" data-testid="run-detail-create-home-activity">
                          <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                            Assessment progress
                          </h2>
                          <p
                            className={cn(
                              "m-0 rounded-md border border-neutral-200 bg-al-surface-raised font-medium leading-snug dark:border-neutral-800 p-3",
                              OPERATOR_TYPOGRAPHY.body,
                            )}
                            role="status"
                            data-testid="run-detail-activity-status-headline"
                          >
                            {createHomeActivityStatusLine}
                          </p>
                          {!m.manifestId ? (
                            <div id="architecture-assessment-progress" className="scroll-mt-24">
                              <RunDetailProgressTrackerDeferred
                                runId={m.routeRunId}
                                initialSummary={m.progressForPipelineUi}
                                preFinalizeReadyToFinalize={createHomePreFinalizeReadyToFinalize}
                                buyerAssessmentCopy
                              />
                            </div>
                          ) : null}
                          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                            <Link
                              className={OPERATOR_LINK.nav}
                              href={`/architecture/reviews/${encodeURIComponent(m.resolvedDetail.run.runId)}/provenance`}
                              data-testid="run-detail-provenance-link"
                            >
                              Full provenance view
                            </Link>
                            {createHomeActivityProvenanceAsOfLabel !== "—" ? (
                              <span className="text-al-text-secondary"> (as of {createHomeActivityProvenanceAsOfLabel})</span>
                            ) : null}
                          </p>
                          <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" open={false}>
                            <summary className="cursor-pointer font-semibold">Outcome metrics and taxonomy</summary>
                            <div className="mt-3">{createHomeActivityOutcomeCardsEl}</div>
                          </details>
                          <Suspense fallback={<RunDetailMidDeferredSkeleton />}>
                            <RunDetailMidDeferredSections context={deferredContext} includeSavingsSummary={false} />
                          </Suspense>
                          <RunDetailActivitySourcesPanelDeferred />
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
                    h1Title={reviewHeaderPresentation.h1Title}
                    eyebrowLabel={reviewHeaderPresentation.eyebrowLabel}
                    reviewIdentifierLabel={reviewHeaderPresentation.reviewIdentifierLabel}
                    workspaceStatus={workspaceStatus}
                    reviewOwner={deriveReviewOwnerLabel(m.resolvedDetail.run)}
                    templateLabel={deriveReviewTemplateLabel(m.manifestSummaryForUi)}
                    finalizedAtLabel={finalizedAtLabel}
                    packageVersionLabel={packageVersionLabel}
                  />

                  <RunDetailColdOpenOrientationDeferred
                    runId={m.resolvedDetail.run.runId}
                    packageTitle={reviewDisplayTitle}
                    packageOwnerLabel={deriveReviewOwnerLabel(m.resolvedDetail.run)}
                    workspaceStatus={workspaceStatus}
                  />

                  <RunDetailReviewPackageDoThisNextResolvedDeferred
                    runId={m.resolvedDetail.run.runId}
                    manifestId={m.manifestId}
                    hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
                    blockingFindingCount={blockingApprovalCount}
                    buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
                    operatorGovernanceDecision={m.resolvedDetail.run.operatorGovernanceDecision}
                    manifestStatus={m.manifestSummary?.status ?? null}
                    runCompleted={m.resolvedDetail.run.completedUtc != null}
                    nextAction={reviewStatusSummary.nextAction}
                    showProgressTracker={m.showProgressTracker}
                    openClarificationGapCount={0}
                    correctionHref={architectureCorrectionHref}
                    useCreateHomeWorkspaceTabs={false}
                    hasGoldenManifest={Boolean(m.manifestId)}
                    commitBlockedReason={commitBlockedReason}
                  />
                    <RunDetailWorkspaceBlockingBannerDeferred
                      blockingCount={blockingApprovalCount}
                    />
                  ) : null}

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
                    evidenceCoverageLine={evidenceCoverageSummary.summaryLine}
                    primaryConcern={reviewStatusSummary.primaryConcern}
                    materialSeverityLine={materialSeverityLine}
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
            <RunDetailBelowFoldSectionsDeferred model={m} context={deferredContext} />
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
