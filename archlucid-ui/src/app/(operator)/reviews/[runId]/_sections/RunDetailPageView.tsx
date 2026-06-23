import { Suspense } from "react";

import { GovernanceModePresentationGate } from "@/components/GovernanceModePresentationGate";
import { WhatIfBranchCompareBanner } from "@/components/draft-intake/WhatIfBranchCompareBanner";
import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { CompareToBaselineCta } from "@/components/CompareToBaselineCta";
import { GenerateAdrFromRunModal } from "@/components/GenerateAdrFromRunModal";
import { CommitBlockingFindingsBanner } from "@/components/usability/CommitBlockingFindingsBanner";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { StalledReviewGuidanceCallout } from "@/components/usability/StalledReviewGuidanceCallout";
import { detectStalledReview } from "@/lib/usability/stalled-review-detection";
import { ExportDeliverableDialog } from "@/components/usability/ExportDeliverableDialog";
import { PersistentSponsorEmailStrip } from "@/components/usability/PersistentSponsorEmailStrip";
import { ReviewPackagePlainSummary } from "@/components/usability/ReviewPackagePlainSummary";
import { ShareableReviewLinkButton } from "@/components/usability/ShareableReviewLinkButton";
import { RunExplanationConfidenceBanner } from "@/components/RunExplanationConfidenceBanner";
import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";
import { ReviewDetailPolicyPackImpactCallout } from "@/components/findings/ReviewDetailPolicyPackImpactCallout";
import { RunDetailPageHeader } from "@/components/RunDetailPageHeader";
import { RunDetailSectionNav } from "@/components/RunDetailSectionNav";
import { RunEstimatedLlmCostCard } from "@/components/RunEstimatedLlmCostCard";
import { RunAgentResultsSummaryCard } from "@/components/RunAgentResultsSummaryCard";
import { RunDetailLastFailureCard, resolveRunDetailLastFailureSummary } from "@/components/RunDetailLastFailureCard";
import { RunRetrievalGroundingSummaryCard } from "@/components/RunRetrievalGroundingSummaryCard";
import { RunProgressTracker } from "@/components/RunProgressTracker";
import { RunTrustEvidenceCardSection } from "@/components/RunTrustEvidenceCardSection";
import { SampleReviewPackageSummary } from "@/components/SampleReviewPackageSummary";
import {
  buyerHeaderStatusTwinPillCaption,
} from "@/lib/review-buyer-disposition-line";
import { shouldShowOperatorDemoMarketingChrome } from "@/lib/buyer-demo-content-gating";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";

import { ReviewAgentExecutionLogSection } from "@/components/reviews/ReviewAgentExecutionLogSection";
import { ReviewSealedIndicatorChip } from "@/components/reviews/ReviewSealedIndicatorChip";
import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";
import { ReviewPackageEvidenceDensityStrip } from "@/components/usability/ReviewPackageEvidenceDensityStrip";
import { RunDetailBreadcrumb } from "./RunDetailBreadcrumb";
import { RunDetailManifestSummarySection } from "./RunDetailManifestSummarySection";
import { RunDetailGovernanceAlerts } from "@/components/reviews/RunDetailGovernanceAlerts";
import { RunDetailDeferredScopeNoticeClient } from "@/components/reviews/RunDetailDeferredScopeNoticeClient";
import { RunDetailFirstScreenProofStatusClient } from "@/components/reviews/RunDetailFirstScreenProofStatusClient";
import { RunDetailRunMetadataSection } from "./RunDetailRunMetadataSection";
import { RunDetailCaptureEvidenceSection } from "./RunDetailCaptureEvidenceSection";
import { RunDetailBuyerModeFallbackBanner } from "./RunDetailBuyerModeFallbackBanner";
import { RunDetailBuyerPilotConversionSection } from "./RunDetailBuyerPilotConversionSection";
import { RunDetailExecutiveSummaryCtaCard } from "./RunDetailExecutiveSummaryCtaCard";
import { RunDetailExecutiveBottomLine } from "./RunDetailExecutiveBottomLine";
import { RunDetailHolisticCriticPanel } from "./RunDetailHolisticCriticPanel";
import { CtoDemoReviewRouteGuard } from "@/components/cto-demo/CtoDemoReviewRouteGuard";
import { RunDetailBelowFoldSections } from "./RunDetailBelowFoldSections";
import { RunDetailMidDeferredSections } from "./RunDetailMidDeferredSections";
import {
  RunDetailBelowFoldDeferredSkeleton,
  RunDetailExplanationSkeleton,
  RunDetailMidDeferredSkeleton,
} from "./RunDetailDeferredSkeleton";
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
export function RunDetailPageView(props: { readonly model: RunDetailPageModel }): React.JSX.Element {
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

  return (
    <div
      className={`w-full space-y-4 px-1 py-2 sm:px-0 ${m.buyerPolishedArtifactTable ? "max-w-[1440px]" : "max-w-[1200px]"}`}
    >
      <CtoDemoReviewRouteGuard runId={m.resolvedDetail.run.runId} />
      <RunDetailBreadcrumb headline={m.headline} />

      {showDemoMarketingChrome ? <OperatorDemoStaticBanner /> : null}
      {m.usedStaticDemoRun ? <DemoDataBadge variant="banner" className="mb-2" /> : null}

      <RunDetailPageHeader
        runSummary={runSummaryForBadge}
        runId={m.resolvedDetail.run.runId}
        manifestId={m.manifestId}
        headline={m.headline}
        hasGoldenManifest={Boolean(m.manifestId)}
        executionFlavorBuyerSummary={m.resolvedDetail.executionFlavorBuyerSummary}
        buyerGovernanceApprovalLabel={
          m.buyerPolishedArtifactTable === true ? m.governanceGateLabel ?? null : null
        }
        buyerHeaderStatusCaption={
          m.buyerPolishedArtifactTable === true
            ? buyerHeaderStatusTwinPillCaption({
                hasGoldenManifest: Boolean(m.manifestId),
                findingCountDisplay: m.findingCountDisplay,
                warningCountDisplay: m.warningCountDisplay,
                unresolvedIssueCountDisplay: m.manifestSummary?.unresolvedIssueCount ?? null,
                governanceGateLabel: m.governanceGateLabel,
                aggregateRiskPosture: m.explanationSummary?.riskPosture ?? null,
              })
            : null
        }
        commitBlockedReason={commitBlockedReason}
        hasGovernanceWarnings={m.resolvedDetail.run.hasGovernanceWarnings === true}
      />

      {reviewPolicyPackCallout !== null ? (
        <ReviewDetailPolicyPackImpactCallout
          ruleSetId={reviewPolicyPackCallout.ruleSetId}
          ruleSetVersion={reviewPolicyPackCallout.ruleSetVersion}
          runId={m.resolvedDetail.run.runId}
          totalFindingCount={m.findingCountDisplay}
        />
      ) : null}

      {!m.manifestId ? (
        (() => {
          const legacyStatus = m.resolvedDetail.run.legacyRunStatus;
          const stalled = detectStalledReview(
            m.resolvedDetail.run.createdUtc,
            m.resolvedDetail.run.completedUtc != null
              || legacyStatus === "Completed"
              || legacyStatus === "Failed",
          );

          return stalled.isStalled ? (
            <StalledReviewGuidanceCallout
              elapsedMinutes={stalled.elapsedMinutes}
              runId={m.resolvedDetail.run.runId}
            />
          ) : null;
        })()
      ) : null}

      {findingCoverageSummary?.hasCommitBlockingFailures === true ? (
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

      <FirstWeekRouteGuidance
        variant={Boolean(m.manifestId) ? "review-detail-committed" : "review-detail-in-progress"}
      />

      {buyerFinalizedPackage ? (
        <>
          {outcomeCardsEl}
          {sectionNavEl}
        </>
      ) : null}

      <RunDetailFirstScreenProofStatusClient runId={m.resolvedDetail.run.runId} />

      {m.manifestId ? (
        <ReviewPackagePlainSummary
          blockingFindingCount={m.manifestSummary?.unresolvedIssueCount ?? 0}
          advisoryFindingCount={Math.max(
            0,
            (m.findingCountDisplay ?? 0) - (m.manifestSummary?.unresolvedIssueCount ?? 0),
          )}
          overallRiskLabel={m.explanationSummary?.riskPosture ?? m.governanceGateLabel ?? "Moderate"}
        />
      ) : null}

      {m.manifestId ? (
        <div className="flex flex-wrap items-center gap-3">
          <ReviewPackageEvidenceDensityStrip
            className="min-w-0 flex-1"
            findingCount={m.findingCountDisplay}
            evidenceArtifactCount={m.artifacts.length}
            policiesCheckedLabel={
              m.manifestSummaryForUi !== null
                ? policyPackBuyerLabel(m.manifestSummaryForUi.ruleSetId, m.manifestSummaryForUi.ruleSetVersion)
                : null
            }
            governanceApprovalLabel={m.governanceGateLabel ?? null}
            auditTrailHref={`/audit?runId=${encodeURIComponent(m.resolvedDetail.run.runId)}`}
          />
          <CtoDemoAuditIntegrityVerifyButton />
        </div>
      ) : null}

      {m.manifestId ? (
        <PersistentSponsorEmailStrip runId={m.resolvedDetail.run.runId} isCommitted />
      ) : null}

      {m.manifestId ? (
        <div className="flex flex-wrap items-center gap-2">
          <ExportDeliverableDialog runId={m.resolvedDetail.run.runId} manifestId={m.manifestId} />
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

      {governanceAlertsEl}
      <RunDetailExecutiveBottomLine explanationSummary={m.explanationSummary} />
      <RunDetailHolisticCriticPanel
        runId={m.resolvedDetail.run.runId}
        hasGoldenManifest={Boolean(m.manifestId)}
      />
      {buyerFinalizedPackage ? null : outcomeCardsEl}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailLastFailureCard
          summary={resolveRunDetailLastFailureSummary(m.resolvedDetail)}
          legacyRunStatus={(m.resolvedDetail.run as { legacyRunStatus?: string | null }).legacyRunStatus ?? null}
        />
      ) : null}

      {buyerFinalizedPackage ? null : (
        <RunDetailExecutiveSummaryCtaCard runId={m.resolvedDetail.run.runId} />
      )}

      {!m.buyerPolishedArtifactTable ? (
        <div className="flex flex-wrap items-center gap-2">
          <GenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={false} />
        </div>
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <CompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />
      ) : null}

      {showDemoMarketingChrome ? sampleReviewPackageSummaryEl : null}


      {!m.buyerPolishedArtifactTable ? (
        <RunEstimatedLlmCostCard estimate={m.resolvedDetail.agentExecutionLlmCostEstimate} />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunAgentResultsSummaryCard results={m.resolvedDetail.results} />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <ReviewAgentExecutionLogSection results={m.resolvedDetail.results} />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunRetrievalGroundingSummaryCard
          summary={m.resolvedDetail.retrievalGroundingSummary}
          runId={m.resolvedDetail.run.runId}
        />
      ) : null}

      {m.showProgressTracker ? (
        <RunProgressTracker runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
      ) : null}

      {buyerFinalizedPackage ? null : sectionNavEl}

      {m.buyerPolishedArtifactTable ? (
        <RunDetailBuyerModeFallbackBanner
          realModeFellBackToSimulator={m.resolvedDetail.run.realModeFellBackToSimulator === true}
        />
      ) : null}

      <RunDetailBuyerPilotConversionSection buyerPolishedArtifactTable={m.buyerPolishedArtifactTable} />

      {m.manifestId && m.resolvedDetail.trustEvidenceCard ? (
        <RunTrustEvidenceCardSection
          card={m.resolvedDetail.trustEvidenceCard}
          evidenceAskRunId={m.buyerPolishedArtifactTable ? m.resolvedDetail.run.runId : null}
        />
      ) : null}

      {!m.manifestId ? (
        <RunDetailCaptureEvidenceSection
          runId={m.resolvedDetail.run.runId}
          buyerPolished={m.buyerPolishedArtifactTable ?? false}
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

      {m.buyerPolishedArtifactTable && m.manifestId ? (
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

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailRunMetadataSection run={m.resolvedDetail.run} runDetailTraceId={m.runDetailTraceId} />
      ) : null}

      <Suspense fallback={<RunDetailBelowFoldDeferredSkeleton />}>
        <RunDetailBelowFoldSections model={m} context={deferredContext} />
      </Suspense>
    </div>
  );
}
