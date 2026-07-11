import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { WhatIfBranchCompareBanner } from "@/components/draft-intake/WhatIfBranchCompareBanner";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { CommitBlockingFindingsBanner } from "@/components/usability/CommitBlockingFindingsBanner";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { StalledReviewGuidanceCallout } from "@/components/usability/StalledReviewGuidanceCallout";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import { PersistentSponsorEmailStrip } from "@/components/usability/PersistentSponsorEmailStrip";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { RunExplanationConfidenceBanner } from "@/components/RunExplanationConfidenceBanner";
import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";
import { ReviewDetailPolicyPackImpactCallout } from "@/components/findings/ReviewDetailPolicyPackImpactCallout";
import { RunDetailSectionNav } from "@/components/RunDetailSectionNav";
import { RunEstimatedLlmCostCard } from "@/components/RunEstimatedLlmCostCard";
import { RunAgentResultsSummaryCard } from "@/components/RunAgentResultsSummaryCard";
import { RunDetailLastFailureCard, resolveRunDetailLastFailureSummary } from "@/components/RunDetailLastFailureCard";
import { RunRetrievalGroundingSummaryCard } from "@/components/RunRetrievalGroundingSummaryCard";
import { RunProgressTracker } from "@/components/RunProgressTracker";
import { RunTrustEvidenceCardSection } from "@/components/RunTrustEvidenceCardSection";
import { SampleReviewPackageSummary } from "@/components/SampleReviewPackageSummary";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer-demo-content-gating";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/run-detail-governance-cta-visibility";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";

import { ReviewAgentExecutionLogSection } from "@/components/reviews/ReviewAgentExecutionLogSection";
import { ReviewSealedIndicatorChip } from "@/components/reviews/ReviewSealedIndicatorChip";
import { ReviewGenerationCreatedNotice } from "@/components/review-intake/ReviewGenerationCreatedNotice";
import type { BuildArchitectureCreatedHomeModelInput } from "@/lib/architecture-created-home-model";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { resolveQuickDecisionFindingsForRunDetail } from "@/lib/quick-decision-summary-derive";
import {
  countFindingsAwaitingAction,
  countFindingsBySeverity,
  deriveArchitectureSystemName,
  deriveBlockingApprovalCount,
  deriveHighestFindingSeverityLabel,
  deriveLastEvaluatedLabel,
  deriveOverallPostureLabel,
  deriveRecommendedWorkspaceActions,
  deriveReviewDisplayTitle,
  deriveReviewOwnerLabel,
  deriveReviewTemplateLabel,
  deriveRunDetailWorkspaceStatus,
  deriveSubmittedArchitectureText,
} from "@/lib/run-detail-workspace-derive";

import { resolveReviewPackagePrimaryAction } from "./resolve-review-package-primary-action";
import { ReviewPackagePrimaryAction } from "./ReviewPackagePrimaryAction";
import { RunDetailGovernanceDecisionSection } from "./RunDetailGovernanceDecisionSection";
import { RunDetailRecommendedActionsPanel } from "./RunDetailRecommendedActionsPanel";
import { RunDetailReviewPackageSection } from "./RunDetailReviewPackageSection";
import { RunDetailSubmittedArchitectureSection } from "./RunDetailSubmittedArchitectureSection";
import {
  RunDetailWorkspaceBlockingBanner,
  RunDetailWorkspaceDisclosureProvider,
  RunDetailWorkspaceHeader,
  RunDetailWorkspaceLayout,
  RunDetailWorkspaceSeverityRail,
  RunDetailWorkspaceSummaryStrip,
} from "./RunDetailWorkspaceChrome";
import { RunDetailWorkspaceStickyActions } from "./RunDetailWorkspaceStickyActions";
import { RunDetailBreadcrumb } from "./RunDetailBreadcrumb";
import { RunDetailManifestSummarySection } from "./RunDetailManifestSummarySection";
import { RunDetailGovernanceAlerts } from "@/components/reviews/RunDetailGovernanceAlerts";
import { RunDetailDeferredScopeNoticeClient } from "@/components/reviews/RunDetailDeferredScopeNoticeClient";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import { RunDetailOperatorTechnicalDisclosure } from "./RunDetailOperatorTechnicalDisclosure";
import { RunDetailRunMetadataSection } from "./RunDetailRunMetadataSection";
import { RunDetailCaptureEvidenceSection } from "./RunDetailCaptureEvidenceSection";
import { RunDetailBuyerModeFallbackBanner } from "./RunDetailBuyerModeFallbackBanner";
import { RunDetailBuyerPilotConversionSection } from "./RunDetailBuyerPilotConversionSection";
import { RunDetailExecutiveSummaryCtaCard } from "./RunDetailExecutiveSummaryCtaCard";
import { RunDetailGovernanceCta } from "./RunDetailGovernanceCta";
import { RunDetailExecutiveBottomLine } from "./RunDetailExecutiveBottomLine";
import { CtoDemoReviewRouteGuard } from "@/components/cto-demo/CtoDemoReviewRouteGuard";
import {
  RunDetailCompareToBaselineCta,
  RunDetailExportDeliverableDialog,
  RunDetailGenerateAdrFromRunModal,
  RunDetailHolisticCriticPanelDeferred,
  RunDetailTechnologyBaselineSection,
} from "./run-detail-page-view-deferred-chunks";
import { RunDetailBelowFoldSections } from "./RunDetailBelowFoldSections";
import { RunDetailArchitectureCreatedFirstViewport } from "./RunDetailArchitectureCreatedFirstViewport";
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
      <SampleReviewPackageSummary
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
  const commitBlockedReason =
    findingCoverageSummary?.hasCommitBlockingFailures === true
      ? m.buyerPolishedArtifactTable === true
        ? "Some checks must finish before this review can be finalized."
        : `Finding coverage is commit-blocking. Failed engines: ${
            findingCoverageSummary.failedEngineLabels?.length
              ? findingCoverageSummary.failedEngineLabels.join(", ")
              : "one or more required finding engines"
          }.`
      : null;

  const governanceAlertsEl = (
    <GovernanceModePresentationGate>
      <>
        <RunDetailGovernanceAlerts
          run={m.resolvedDetail.run}
          hasCommitBlockingFailures={findingCoverageSummary?.hasCommitBlockingFailures === true}
        />
        <RunDetailDeferredScopeNoticeClient />
      </>
    </GovernanceModePresentationGate>
  );

  const outcomeCardsEl = (
    <RunDetailOutcomeCards
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

  const sectionNavEl = <RunDetailSectionNav sections={m.runDetailNavSections} />;

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
    <RunDetailGovernanceCta runId={m.resolvedDetail.run.runId} demoted />
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

  const showGovernanceCtaCard =
    governanceCtaEl !== null && reviewPackagePrimaryAction.kind !== "open-governance-decision";

  const buyerGoldenPageReady =
    m.buyerPolishedArtifactTable === true &&
    isShowcaseStaticDemoRunId(m.resolvedDetail.run.runId) &&
    m.headline.trim().length > 0 &&
    Boolean(m.manifestId);

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(
    m.resolvedDetail,
    m.explanationSummary,
  );
  const severityCounts = countFindingsBySeverity(quickDecisionFindings);
  const workspaceStatus = deriveRunDetailWorkspaceStatus({
    run: m.resolvedDetail.run,
    manifestId: m.manifestId,
    manifestStatus: m.manifestSummary?.status ?? null,
    showProgressTracker: m.showProgressTracker,
    operatorGovernanceDecision: m.resolvedDetail.run.operatorGovernanceDecision,
    buyerPolishedArtifactTable: m.buyerPolishedArtifactTable,
  });
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
  });
  const submittedArchitectureText = deriveSubmittedArchitectureText(runSummaryForBadge, reviewDisplayTitle);
  const governanceDecisionLabel =
    (m.resolvedDetail.run.operatorGovernanceDecision ?? "").trim().length > 0
      ? (m.resolvedDetail.run.operatorGovernanceDecision ?? "").trim()
      : m.governanceGateLabel ?? "No governance decision recorded";
  const evidenceCoverageLabel =
    m.resolvedDetail.trustEvidenceCard !== null && m.resolvedDetail.trustEvidenceCard !== undefined
      ? `${m.artifacts.length} evidence artifact${m.artifacts.length === 1 ? "" : "s"}`
      : null;

  const showArchitectureCreatedHome =
    props.fromArchitectureCreation === true && (m.manifestId ?? "").trim().length === 0;
  const lastEvaluatedUtc = deriveLastEvaluatedLabel(m.resolvedDetail.run, m.manifestSummary);
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
      className={`w-full ${OPERATOR_LAYOUT.sectionStack} px-1 py-2 sm:px-0 max-w-[1160px]`}
    >
      <CtoDemoReviewRouteGuard runId={m.resolvedDetail.run.runId} />
      <RunDetailBreadcrumb headline={m.headline} />

      {!showArchitectureCreatedHome ? (
        <Suspense fallback={null}>
          <ReviewGenerationCreatedNotice analysisInProgress={m.showProgressTracker} />
        </Suspense>
      ) : null}

      {showDemoMarketingChrome ? <OperatorDemoStaticBanner /> : null}
      {m.usedStaticDemoRun ? <DemoDataBadge variant="banner" className="mb-2" /> : null}

      <RunDetailWorkspaceDisclosureProvider>
        <RunDetailWorkspaceLayout
          stickyActions={
            showArchitectureCreatedHome ? null : (
              <RunDetailWorkspaceStickyActions
                runId={m.resolvedDetail.run.runId}
                primaryAction={reviewPackagePrimaryAction}
                hasGoldenManifest={Boolean(m.manifestId)}
                commitBlockedReason={commitBlockedReason}
                showProgressTracker={m.showProgressTracker}
                manifestId={m.manifestId}
              />
            )
          }
          main={
            <>
              {showArchitectureCreatedHome ? (
                <RunDetailArchitectureCreatedFirstViewport
                  baseline={architectureCreatedBaseline}
                  architectureSourceText={submittedArchitectureText ?? ""}
                  canEditDiagram={!m.manifestId}
                  findings={quickDecisionFindings}
                />
              ) : (
                <>
                  <RunDetailWorkspaceHeader
                    reviewTitle={reviewDisplayTitle}
                    systemName={systemName}
                    workspaceStatus={workspaceStatus}
                    overallPosture={overallPosture}
                    highestSeverity={highestSeverity}
                    lastEvaluatedUtc={lastEvaluatedUtc}
                    reviewOwner={deriveReviewOwnerLabel(m.resolvedDetail.run)}
                    templateLabel={deriveReviewTemplateLabel(m.manifestSummaryForUi)}
                  />

                  <RunDetailWorkspaceSummaryStrip
                    overallPosture={overallPosture}
                    criticalCount={severityCounts.critical}
                    highCount={severityCounts.high}
                    awaitingActionCount={countFindingsAwaitingAction(quickDecisionFindings)}
                    governanceDecisionLabel={governanceDecisionLabel}
                    evidenceCoverageLabel={evidenceCoverageLabel}
                  />
                </>
              )}

              {!showArchitectureCreatedHome ? (
                <RunDetailWorkspaceBlockingBanner blockingCount={blockingApprovalCount} />
              ) : null}

              {!showArchitectureCreatedHome ? (
                <ReviewPackagePrimaryAction
                  action={reviewPackagePrimaryAction}
                  runId={m.resolvedDetail.run.runId}
                  hasGoldenManifest={Boolean(m.manifestId)}
                  commitBlockedReason={commitBlockedReason}
                />
              ) : null}

              <div className="lg:hidden">{sectionNavEl}</div>

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
                    <StalledReviewGuidanceCallout
                      elapsedMinutes={stalled.elapsedMinutes}
                      runId={m.resolvedDetail.run.runId}
                    />
                  ) : null;
                })()
              ) : null}

              {findingCoverageSummary?.hasCommitBlockingFailures === true && !showArchitectureCreatedHome ? (
                <CommitBlockingFindingsBanner
                  runId={m.resolvedDetail.run.runId}
                  blockingFindings={[
                    {
                      findingId: "blocking-findings",
                      title: "Open blocking findings — review findings section below",
                    },
                  ]}
                />
              ) : null}

              {!m.manifestId && m.showProgressTracker ? (
                <div
                  id={showArchitectureCreatedHome ? "architecture-assessment-progress" : undefined}
                  className={showArchitectureCreatedHome ? "scroll-mt-24" : undefined}
                >
                  <RunProgressTracker runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
                </div>
              ) : null}

              {!showArchitectureCreatedHome ? (
                <RunDetailFirstScreenProofStatusClient runId={m.resolvedDetail.run.runId} />
              ) : null}

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
                  providerNeutralWorkItems={showArchitectureCreatedHome}
                  architectureWorkItemContext={
                    showArchitectureCreatedHome
                      ? {
                          architectureName: architectureCreatedBaseline.architectureName,
                          architectureOverview: architectureCreatedBaseline.architectureOverview,
                          ownerLabel: architectureCreatedBaseline.ownerLabel,
                        }
                      : null
                  }
                />
              </Suspense>

              {!showArchitectureCreatedHome ? (
                <RunDetailRecommendedActionsPanel actions={recommendedActions} />
              ) : null}

              {!showArchitectureCreatedHome ? (
                <RunDetailGovernanceDecisionSection
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
              ) : null}

              {!showArchitectureCreatedHome ? (
                <RunDetailReviewPackageSection
                  manifestId={m.manifestId}
                  runId={m.resolvedDetail.run.runId}
                  artifactCount={m.artifacts.length}
                  findingCount={m.findingCountDisplay}
                  showExportActions={Boolean(m.manifestId) && !m.usedStaticDemoRun}
                />
              ) : null}

              <RunDetailSubmittedArchitectureSection
                architectureText={submittedArchitectureText}
                canEditSource={!m.manifestId}
                editHref={
                  !m.manifestId
                    ? `/reviews/new?path=guided-intake&rerun=${encodeURIComponent(m.resolvedDetail.run.runId)}`
                    : null
                }
                useStructuredPresentation={showArchitectureCreatedHome}
                runId={m.resolvedDetail.run.runId}
                sectionTitle={showArchitectureCreatedHome ? "Generated architecture" : undefined}
                helperText={
                  showArchitectureCreatedHome
                    ? "Structured sections below summarize what ArchLucid understood from your brief — raw model output stays behind View generated source."
                    : undefined
                }
              />

              <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" data-workspace-disclosure open={false}>
                <summary className="cursor-pointer font-semibold">Detailed outcome cards</summary>
                <div className="mt-3">{outcomeCardsEl}</div>
              </details>
            </>
          }
          rail={
            showArchitectureCreatedHome ? (
              <>{sectionNavEl}</>
            ) : (
              <>
                <ReviewPackagePrimaryAction
                  action={reviewPackagePrimaryAction}
                  runId={m.resolvedDetail.run.runId}
                  hasGoldenManifest={Boolean(m.manifestId)}
                  commitBlockedReason={commitBlockedReason}
                />
                <RunDetailWorkspaceSeverityRail
                  criticalCount={severityCounts.critical}
                  highCount={severityCounts.high}
                  mediumCount={severityCounts.medium}
                  lowCount={severityCounts.low}
                />
                {sectionNavEl}
              </>
            )
          }
        />
      </RunDetailWorkspaceDisclosureProvider>

      {reviewPolicyPackCallout !== null ? (
        <ReviewDetailPolicyPackImpactCallout
          ruleSetId={reviewPolicyPackCallout.ruleSetId}
          ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
          runId={m.resolvedDetail.run.runId}
          totalFindingCount={m.findingCountDisplay}
        />
      ) : null}

      <FirstWeekRouteGuidance
        variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
      />

      <RunDetailTechnologyBaselineSection
        runId={m.resolvedDetail.run.runId}
        manifestFinalized={Boolean(m.manifestId)}
        buyerPolished={m.buyerPolishedArtifactTable ?? false}
        usedStaticDemoRun={m.usedStaticDemoRun}
        warningCountDisplay={m.warningCountDisplay ?? 0}
      />

      {!m.manifestId ? (
        <RunDetailCaptureEvidenceSection
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

      {governanceAlertsEl}
      <RunDetailExecutiveBottomLine explanationSummary={m.explanationSummary} />

      {m.manifestId && m.resolvedDetail.trustEvidenceCard ? (
        <RunTrustEvidenceCardSection
          card={m.resolvedDetail.trustEvidenceCard}
          evidenceAskRunId={m.buyerPolishedArtifactTable ? m.resolvedDetail.run.runId : null}
        />
      ) : null}

      {m.manifestId && m.manifestSummaryForUi ? (
        <RunDetailManifestSummarySection
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
        <RunExplanationConfidenceBanner summary={m.explanationSummary} />
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
          <WhatIfBranchCompareBanner
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

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailLastFailureCard
          summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
          legacyRunStatus={(m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null}
        />
      ) : null}

      {buyerFinalizedPackage ? null : (
        <RunDetailExecutiveSummaryCtaCard runId={m.resolvedDetail.run.runId} demoted />
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
        <RunDetailOperatorTechnicalDisclosure>
          <RunEstimatedLlmCostCard estimate={m.resolvedDetail.agentExecutionLlmCostEstimate} />
          <RunAgentResultsSummaryCard results={m.resolvedDetail.results} />
          <ReviewAgentExecutionLogSection results={m.resolvedDetail.results} />
          <RunRetrievalGroundingSummaryCard
            summary={m.resolvedDetail.retrievalGroundingSummary}
            runId={m.resolvedDetail.run.runId}
          />
          <RunDetailRunMetadataSection run={m.resolvedDetail.run} runDetailTraceId={m.runDetailTraceId} />
        </RunDetailOperatorTechnicalDisclosure>
      ) : null}

      {m.showProgressTracker && m.manifestId ? (
        <RunProgressTracker runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
      ) : null}

      {buyerFinalizedPackage ? null : sectionNavEl}

      {m.buyerPolishedArtifactTable ? (
        <RunDetailBuyerModeFallbackBanner
          realModeFellBackToSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
        />
      ) : null}

      <RunDetailBuyerPilotConversionSection buyerPolishedArtifactTable={m.buyerPolishedArtifactTable} />

      <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
        <RunDetailBelowFoldSections model={m} context={deferredContext} />
      </Suspense>
    </div>
  );

  return (
    <div data-testid="review-detail-root">
      {buyerGoldenPageReady ? (
        <div data-testid="buyer-golden-page-ready" className="contents">
          {runDetailBody}
        </div>
      ) : (
        runDetailBody
      )}
    </div>
  );
}
