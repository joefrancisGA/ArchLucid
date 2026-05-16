import { ChangesSinceLastReviewBanner } from "@/components/ChangesSinceLastReviewBanner";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { CompareToBaselineCta } from "@/components/CompareToBaselineCta";
import { GenerateAdrFromRunModal } from "@/components/GenerateAdrFromRunModal";
import { PostCommitRetentionRail } from "@/components/PostCommitRetentionRail";
import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";
import { RunDetailPageHeader } from "@/components/RunDetailPageHeader";
import { RunDetailSectionNav } from "@/components/RunDetailSectionNav";
import { RunEstimatedLlmCostCard } from "@/components/RunEstimatedLlmCostCard";
import { RunProgressTracker } from "@/components/RunProgressTracker";
import { RunSavingsSummary } from "@/components/RunSavingsSummary";
import { RunTrustEvidenceCardSection } from "@/components/RunTrustEvidenceCardSection";
import { RunAgentForensicsSection } from "@/components/RunAgentForensicsSection";
import { SampleReviewPackageSummary } from "@/components/SampleReviewPackageSummary";
import {
  buyerHeaderStatusTwinPillCaption,
} from "@/lib/review-buyer-disposition-line";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";

import { RunDetailAdvancedAnalysisSection } from "./RunDetailAdvancedAnalysisSection";
import { RunDetailArchitectureGraphSection } from "./RunDetailArchitectureGraphSection";
import { RunDetailArtifactsExportsSection } from "./RunDetailArtifactsExportsSection";
import { RunDetailAuthorityChainSection } from "./RunDetailAuthorityChainSection";
import { RunDetailBreadcrumb } from "./RunDetailBreadcrumb";
import { RunDetailExecutiveSummaryCtaCard } from "./RunDetailExecutiveSummaryCtaCard";
import { RunDetailManifestSummaryAlerts } from "./RunDetailManifestSummaryAlerts";
import { RunDetailManifestSummarySection } from "./RunDetailManifestSummarySection";
import { RunDetailOperatorPipelineToolsCollapsible } from "./RunDetailOperatorPipelineToolsCollapsible";
import { RunDetailOperatorTechnicalFooter } from "./RunDetailOperatorTechnicalFooter";
import { RunDetailPipelineTimelineSection } from "./RunDetailPipelineTimelineSection";
import { RunDetailPreFinalizedEmptyState } from "./RunDetailPreFinalizedEmptyState";
import { RunDetailRunActionsSection } from "./RunDetailRunActionsSection";
import { RunDetailRunExplanationCollapsible } from "./RunDetailRunExplanationCollapsible";
import { RunDetailRunMetadataSection } from "./RunDetailRunMetadataSection";
import { RunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";
import { RunDetailCaptureEvidenceSection } from "./RunDetailCaptureEvidenceSection";
import type { RunDetailPageModel } from "./run-detail-page-model";

/** Server component: renders the main run detail chrome from a preloaded `RunDetailPageModel`. */
export function RunDetailPageView(props: { readonly model: RunDetailPageModel }): React.JSX.Element {
  const m = props.model;
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

  const changesSinceLastReviewBannerEl =
    m.changesSinceLastReviewBanner !== null ? (
      <ChangesSinceLastReviewBanner
        priorReviewDateLabel={m.changesSinceLastReviewBanner.priorReviewDateLabel}
        priorRunId={m.changesSinceLastReviewBanner.priorRunId}
        currentRunId={m.changesSinceLastReviewBanner.currentRunId}
        copy={m.changesSinceLastReviewBanner.copy}
      />
    ) : null;

  return (
    <div
      className={`mx-auto space-y-6 px-1 py-2 sm:px-0 ${m.buyerPolishedArtifactTable ? "max-w-6xl" : "max-w-4xl"}`}
    >
      <RunDetailBreadcrumb headline={m.headline} />

      {m.usedStaticDemoRun ? <OperatorDemoStaticBanner /> : null}

      <RunDetailPageHeader
        runSummary={runSummaryForBadge}
        runId={m.resolvedDetail.run.runId}
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
      />

      {m.savingsSummary !== null ? <RunSavingsSummary model={m.savingsSummary} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <GenerateAdrFromRunModal input={m.adrGeneratorInput} buyerPolished={m.buyerPolishedArtifactTable} />
      </div>

      <CompareToBaselineCta currentRunId={m.resolvedDetail.run.runId} />

      {m.usedStaticDemoRun && !m.buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {m.buyerPolishedArtifactTable && m.manifestId ? (
        <RunDetailExecutiveSummaryCtaCard runId={m.resolvedDetail.run.runId} />
      ) : null}

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
        showcasePolicyPackStrip={
          m.buyerPolishedArtifactTable &&
          m.manifestSummaryForUi !== null &&
          isShowcaseStaticDemoRunId(m.resolvedDetail.run.runId)
            ? {
                href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
                label: policyPackBuyerLabel(m.manifestSummaryForUi.ruleSetId, m.manifestSummaryForUi.ruleSetVersion),
              }
            : null
        }
      />

      {changesSinceLastReviewBannerEl}

      <RunEstimatedLlmCostCard estimate={m.resolvedDetail.agentExecutionLlmCostEstimate} />

      {m.usedStaticDemoRun && m.buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {m.showProgressTracker ? (
        <RunProgressTracker runId={m.routeRunId} initialSummary={m.progressForPipelineUi} />
      ) : null}

      <RunDetailSectionNav sections={m.runDetailNavSections} />

      {m.manifestId && m.resolvedDetail.trustEvidenceCard ? (
        <RunTrustEvidenceCardSection card={m.resolvedDetail.trustEvidenceCard} />
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
        <RunDetailRunExplanationCollapsible
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
          quickDecisionFindings={m.quickDecisionFindings}
          findingWireSnapshots={m.findingWireSnapshots}
          findingCountDisplay={m.findingCountDisplay}
          warningCountDisplay={m.warningCountDisplay}
          explanationSummary={m.explanationSummary}
          explanationFailure={m.explanationFailure}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailRunMetadataSection run={m.resolvedDetail.run} runDetailTraceId={m.runDetailTraceId} />
      ) : null}

      <RunDetailPipelineTimelineSection
        runId={m.routeRunId}
        buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        pipelineTimelineFailure={m.pipelineTimelineFailure}
        pipelineTimelineForUi={m.pipelineTimelineForUi}
      />

      {m.resolvedDetail.run.graphSnapshotId ? (
        <RunDetailArchitectureGraphSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailAuthorityChainSection run={m.resolvedDetail.run} manifestId={m.manifestId} />
      ) : null}

      {!m.manifestId ? <RunDetailPreFinalizedEmptyState /> : null}

      <RunDetailManifestSummaryAlerts
        manifestSummaryFailure={m.manifestSummaryFailure}
        manifestSummaryMalformed={m.manifestSummaryMalformed}
      />

      {m.manifestId ? (
        <PostCommitRetentionRail
          runId={m.routeRunId}
          showCompareCta={m.canShowCompareReviewButton}
          buyerShowcaseQuickLinks={m.usedStaticDemoRun}
          goldenManifestId={m.manifestId}
        />
      ) : null}

      {m.manifestId ? (
        <RunDetailArtifactsExportsSection
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
            m.usedStaticDemoRun === true ? "Sample healthcare claims policy pack used for this review." : null
          }
        />
      ) : null}

      {!m.buyerPolishedArtifactTable && m.manifestId ? (
        <RunDetailRunExplanationCollapsible
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
          quickDecisionFindings={m.quickDecisionFindings}
          findingWireSnapshots={m.findingWireSnapshots}
          findingCountDisplay={m.findingCountDisplay}
          warningCountDisplay={m.warningCountDisplay}
          explanationSummary={m.explanationSummary}
          explanationFailure={m.explanationFailure}
        />
      ) : null}

      {m.showPilotScorecardPackageCta && m.manifestId ? (
        <RunDetailSponsorBriefingSection
          runId={m.routeRunId}
          manifestId={m.manifestId}
          curatedSampleRun={m.usedStaticDemoRun}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        />
      ) : null}

      {m.manifestId ? <BeforeAfterDeltaPanel variant="inline" runId={m.routeRunId} /> : null}

      {m.manifestId ? (
        <RunDetailAdvancedAnalysisSection
          runId={m.routeRunId}
          buyerPolishedArtifactTable={m.buyerPolishedArtifactTable}
        />
      ) : null}

      {!m.buyerPolishedArtifactTable ? <RunAgentForensicsSection runId={m.routeRunId} /> : null}

      {!m.buyerPolishedArtifactTable ? (
        <RunDetailRunActionsSection runId={m.resolvedDetail.run.runId} manifestId={m.manifestId} />
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
    </div>
  );
}
