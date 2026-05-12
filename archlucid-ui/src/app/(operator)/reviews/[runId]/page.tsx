import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { ChangesSinceLastReviewBanner } from "@/components/ChangesSinceLastReviewBanner";
import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
  coerceRunComparison,
  coerceRunDetail,
} from "@/lib/operator-response-guards";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance-gate-display";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import {
  canonicalizeDemoRunId,
  demoRunUrlRequiresCanonicalRedirect,
  isShowcaseStaticDemoRunId,
} from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { effectiveRunSummaryForPipeline } from "@/lib/run-summary-from-detail";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { CompareToBaselineCta } from "@/components/CompareToBaselineCta";
import { GenerateAdrFromRunModal } from "@/components/GenerateAdrFromRunModal";
import { PostCommitRetentionRail } from "@/components/PostCommitRetentionRail";
import { RunDetailMinimalChromeMount } from "@/components/RunDetailMinimalChromeMount";
import { RunDetailSectionNav } from "@/components/RunDetailSectionNav";
import { RunDetailOutcomeCards } from "@/components/RunDetailOutcomeCards";
import { RunDetailPageHeader } from "@/components/RunDetailPageHeader";
import { RunEstimatedLlmCostCard } from "@/components/RunEstimatedLlmCostCard";
import { RunTrustEvidenceCardSection } from "@/components/RunTrustEvidenceCardSection";
import { RunAgentForensicsSection } from "@/components/RunAgentForensicsSection";
import { SampleReviewPackageSummary } from "@/components/SampleReviewPackageSummary";
import { RunProgressTracker } from "@/components/RunProgressTracker";
import {
  type ApiResponseWithTrace,
  compareRuns,
  getManifestSummary,
  getRunDetail,
  getRunExplanationSummary,
  getRunPipelineTimeline,
  getRunSummary,
  listArtifacts,
  listRunsByProject,
} from "@/lib/api";
import {
  tryStaticDemoArtifacts,
  tryStaticDemoExplanationSummary,
  tryStaticDemoGoldenManifestJsonForExport,
  tryStaticDemoManifestSummary,
  tryStaticDemoPipelineTimeline,
  tryStaticDemoRunDetail,
} from "@/lib/operator-static-demo";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
} from "@/lib/showcase-static-demo";
import { resolveReviewOutcomeCounts } from "@/lib/review-outcome-counts";
import { isUsableGoldenManifestExportJson } from "@/lib/export-markdown";
import { deriveChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { buildAdrGeneratorRunInput } from "@/lib/adr-from-run";
import { findPriorCommittedRun } from "@/lib/find-prior-committed-run";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import {
  buildFindingWireSnapshotsForRunDetail,
  resolveQuickDecisionFindingsForRunDetail,
  severityBadgeLabel,
} from "@/lib/quick-decision-summary-derive";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { buildRunDetailNavSections } from "./_sections/build-run-detail-nav-sections";
import { RunDetailAdvancedAnalysisSection } from "./_sections/RunDetailAdvancedAnalysisSection";
import { RunDetailArchitectureGraphSection } from "./_sections/RunDetailArchitectureGraphSection";
import { RunDetailArtifactsExportsSection } from "./_sections/RunDetailArtifactsExportsSection";
import { RunDetailAuthorityChainSection } from "./_sections/RunDetailAuthorityChainSection";
import { RunDetailBreadcrumb } from "./_sections/RunDetailBreadcrumb";
import { RunDetailExecutiveSummaryCtaCard } from "./_sections/RunDetailExecutiveSummaryCtaCard";
import { RunDetailManifestSummaryAlerts } from "./_sections/RunDetailManifestSummaryAlerts";
import { RunDetailManifestSummarySection } from "./_sections/RunDetailManifestSummarySection";
import { RunDetailOperatorPipelineToolsCollapsible } from "./_sections/RunDetailOperatorPipelineToolsCollapsible";
import { RunDetailOperatorTechnicalFooter } from "./_sections/RunDetailOperatorTechnicalFooter";
import { RunDetailPipelineTimelineSection } from "./_sections/RunDetailPipelineTimelineSection";
import { RunDetailPreFinalizedEmptyState } from "./_sections/RunDetailPreFinalizedEmptyState";
import { RunDetailRunActionsSection } from "./_sections/RunDetailRunActionsSection";
import { RunDetailRunExplanationCollapsible } from "./_sections/RunDetailRunExplanationCollapsible";
import { RunDetailRunMetadataSection } from "./_sections/RunDetailRunMetadataSection";
import { RunDetailSponsorBriefingSection } from "./_sections/RunDetailSponsorBriefingSection";

/** Server-rendered run detail page. Data loading stays here; layout sections live under `_sections/`. */
export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  if (isInvalidGuidOrSlugRouteToken(runId)) {
    notFound();
  }

  if (demoRunUrlRequiresCanonicalRedirect(runId)) {
    redirect(`/reviews/${encodeURIComponent(canonicalizeDemoRunId(runId))}`);
  }

  let runDetailResponse: ApiResponseWithTrace<RunDetail> | null = null;
  let loadFailure: ApiLoadFailureState | null = null;
  let usedStaticDemoRun = false;

  try {
    runDetailResponse = await getRunDetail(runId);
  } catch (e) {
    const fallback = tryStaticDemoRunDetail(runId);

    if (fallback !== null) {
      runDetailResponse = { data: fallback, traceId: null };
      loadFailure = null;
      usedStaticDemoRun = true;
    } else {
      loadFailure = toApiLoadFailure(e);

      if (isApiNotFoundFailure(loadFailure)) {
        notFound();
      }
    }
  }

  if (loadFailure || !runDetailResponse) {
    const fallback = loadFailure?.message ?? "Review not found or could not be loaded.";

    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
          <OperatorApiProblem
            problem={loadFailure?.problem ?? null}
            fallbackMessage={fallback}
            correlationId={loadFailure?.correlationId ?? null}
          />
          <p>
            <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
              ← Back to reviews
            </Link>
          </p>
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  let envelope = coerceRunDetail(runDetailResponse.data);

  if (!envelope.ok) {
    const staticDetail = tryStaticDemoRunDetail(runId);

    if (staticDetail !== null) {
      runDetailResponse = { data: staticDetail, traceId: runDetailResponse.traceId };
      envelope = coerceRunDetail(staticDetail);
      usedStaticDemoRun = true;
    }
  }

  if (!envelope.ok) {
    return (
      <RunDetailMinimalChromeMount>
        <div className="mx-auto max-w-4xl space-y-4 px-1 py-2 sm:px-0">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Review detail</h1>
          <OperatorMalformedCallout>
            <strong>Review detail response was not usable.</strong>
            <p className="mt-2">{envelope.message}</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              The review record could not be displayed. Try reloading.
            </p>
          </OperatorMalformedCallout>
          <p>
            <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
              ← Back to reviews
            </Link>
          </p>
        </div>
      </RunDetailMinimalChromeMount>
    );
  }

  const resolvedDetail = envelope.value;

  let canShowCompareReviewButton = false;
  let priorCommittedRun: RunSummary | null = null;

  try {
    const projectRuns = await listRunsByProject(resolvedDetail.run.projectId, 60);

    canShowCompareReviewButton = projectRuns.length >= 2;
    priorCommittedRun = findPriorCommittedRun(resolvedDetail.run.runId, projectRuns);
  } catch {
    canShowCompareReviewButton = false;
  }

  const buyerPolishedArtifactTable = isBuyerPolishedOperatorShellEnv();
  const manifestId = resolvedDetail.run.goldenManifestId;

  let changesSinceLastReviewBannerEl: ReactElement | null = null;

  if (manifestId !== undefined && manifestId !== null && manifestId.trim().length > 0 && priorCommittedRun !== null) {
    try {
      const rawCompare: unknown = await compareRuns(priorCommittedRun.runId, resolvedDetail.run.runId);
      const coercedCmp = coerceRunComparison(rawCompare);

      if (coercedCmp.ok) {
        const copy = deriveChangesSinceLastReviewCopy(coercedCmp.value);

        if (copy !== null) {
          changesSinceLastReviewBannerEl = (
            <ChangesSinceLastReviewBanner
              priorReviewDateLabel={formatInstantForLocale(priorCommittedRun.createdUtc)}
              priorRunId={priorCommittedRun.runId}
              currentRunId={resolvedDetail.run.runId}
              copy={copy}
            />
          );
        }
      }
    } catch {
      changesSinceLastReviewBannerEl = null;
    }
  }

  let goldenManifestJsonForExport: unknown | null = null;

  if (isUsableGoldenManifestExportJson(resolvedDetail.goldenManifest)) {
    goldenManifestJsonForExport = resolvedDetail.goldenManifest;
  } else if (usedStaticDemoRun) {
    goldenManifestJsonForExport = tryStaticDemoGoldenManifestJsonForExport(runId);
  }

  const runDetailTraceId = runDetailResponse.traceId;

  let progressInitialSummary: RunSummary | null = null;

  try {
    progressInitialSummary = await getRunSummary(runId);
  } catch {
    progressInitialSummary = null;
  }

  function pipelineCompleteOnSummary(s: RunSummary | null): boolean {
    return (
      s !== null &&
      s.hasContextSnapshot === true &&
      s.hasGraphSnapshot === true &&
      s.hasFindingsSnapshot === true &&
      s.hasGoldenManifest === true
    );
  }

  const progressForPipelineUi = effectiveRunSummaryForPipeline(progressInitialSummary, resolvedDetail);

  const showProgressTracker =
    !manifestId || !pipelineCompleteOnSummary(progressForPipelineUi);

  let manifestSummary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let manifestSummaryFailure: ApiLoadFailureState | null = null;
  let manifestSummaryMalformed: string | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let artifactsMalformed: string | null = null;
  let explanationSummary: RunExplanationSummary | null = null;
  let explanationFailure: ApiLoadFailureState | null = null;
  let pipelineTimeline: PipelineTimelineItem[] | null = null;
  let pipelineTimelineFailure: ApiLoadFailureState | null = null;

  try {
    pipelineTimeline = await getRunPipelineTimeline(runId);
  } catch (e) {
    pipelineTimelineFailure = toApiLoadFailure(e);

    if (usedStaticDemoRun) {
      const staticTimeline = tryStaticDemoPipelineTimeline(runId);

      if (staticTimeline !== null && staticTimeline.length > 0) {
        pipelineTimeline = staticTimeline;
        pipelineTimelineFailure = null;
      }
    }
  }

  if (pipelineTimeline === null || pipelineTimeline.length === 0) {
    const staticTimeline = tryStaticDemoPipelineTimeline(runId);

    if (staticTimeline !== null && staticTimeline.length > 0) {
      pipelineTimeline = staticTimeline;
      pipelineTimelineFailure = null;
    }
  }

  const pipelineTimelineForUi: PipelineTimelineItem[] | null = buyerPolishedArtifactTable
    ? pipelineTimeline?.filter((e) => isTimelineMilestoneEvent(e.eventType)) ?? null
    : pipelineTimeline;

  if (manifestId) {
    try {
      const rawSummary: unknown = await getManifestSummary(manifestId);
      const coercedSummary = coerceManifestSummary(rawSummary);

      if (!coercedSummary.ok) {
        manifestSummaryMalformed = coercedSummary.message;
      } else {
        manifestSummary = coercedSummary.value;
      }
    } catch (e) {
      manifestSummaryFailure = toApiLoadFailure(e);
      const staticSummary = tryStaticDemoManifestSummary(manifestId);

      if (staticSummary !== null) {
        manifestSummary = staticSummary;
        manifestSummaryFailure = null;
      }
    }

    try {
      const rawArtifacts: unknown = await listArtifacts(manifestId);
      const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

      if (!coercedArtifacts.ok) {
        artifacts = [];
        artifactsMalformed = coercedArtifacts.message;
      } else {
        artifacts = coercedArtifacts.items;
      }
    } catch (e) {
      artifactsFailure = toApiLoadFailure(e);
      const staticArtifacts = tryStaticDemoArtifacts(runId, manifestId);

      if (staticArtifacts !== null) {
        artifacts = staticArtifacts;
        artifactsFailure = null;
      }
    }

    try {
      explanationSummary = await getRunExplanationSummary(runId);
    } catch (e) {
      explanationFailure = toApiLoadFailure(e);
      const staticExplanation = tryStaticDemoExplanationSummary(runId);

      if (staticExplanation !== null) {
        explanationSummary = staticExplanation;
        explanationFailure = null;
      }
    }

    if (
      explanationSummary !== null &&
      explanationFailure === null &&
      (explanationSummary.findingCount ?? 0) === 0
    ) {
      const staticExplanation = tryStaticDemoExplanationSummary(runId);

      if (staticExplanation !== null && (staticExplanation.findingCount ?? 0) > 0) {
        explanationSummary = staticExplanation;
      }
    }
  }

  const buyerPolishedSections = buyerPolishedArtifactTable;

  const runDetailNavSections = buildRunDetailNavSections({
    buyerPolishedSections,
    manifestSummary,
    trustEvidenceCard: resolvedDetail.trustEvidenceCard,
    manifestId,
    graphSnapshotId: resolvedDetail.run.graphSnapshotId,
  });

  const runSummaryForBadge = progressForPipelineUi;
  const descriptionTrimmed = resolvedDetail.run.description?.trim() ?? "";

  const { findingCountDisplay, warningCountDisplay } = resolveReviewOutcomeCounts({
    runId: resolvedDetail.run.runId,
    usedStaticDemoRun,
    explanationSummary,
    manifestSummary,
  });

  const manifestSummaryForUi: ManifestSummary | null =
    manifestSummary === null
      ? null
      : {
          ...manifestSummary,
          warningCount:
            typeof warningCountDisplay === "number" && Number.isFinite(warningCountDisplay)
              ? Math.trunc(warningCountDisplay)
              : manifestSummary.warningCount,
        };

  const headline = buyerPolishedArtifactTable
    ? isShowcaseStaticDemoRunId(resolvedDetail.run.runId)
      ? SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE
      : buyerFacingReviewTitleFromSummary(resolvedDetail.run as RunSummary)
    : descriptionTrimmed.length > 0
      ? descriptionTrimmed
      : `Review ${resolvedDetail.run.runId}`;

  const createdLabel = formatInstantForLocale(resolvedDetail.run.createdUtc);

  const showPilotScorecardPackageCta =
    Boolean(manifestId) &&
    manifestSummary !== null &&
    isManifestCommittedForPilotScorecardPackage(manifestSummary);

  const governanceGateLabel =
    manifestSummary !== null ? governanceGateLabelFromManifestStatus(manifestSummary.status) : null;

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(resolvedDetail, explanationSummary);
  const findingWireSnapshots = buildFindingWireSnapshotsForRunDetail(resolvedDetail, explanationSummary);

  const adrGeneratorInput = buildAdrGeneratorRunInput({
    runId: resolvedDetail.run.runId,
    projectId: resolvedDetail.run.projectId,
    reviewTitle: headline,
    createdUtc: resolvedDetail.run.createdUtc,
    manifestStatusLabel: manifestSummaryForUi !== null ? manifestStatusForDisplay(manifestSummaryForUi.status) : null,
    policyPackLabel:
      manifestSummaryForUi !== null
        ? policyPackBuyerLabel(manifestSummaryForUi.ruleSetId, manifestSummaryForUi.ruleSetVersion)
        : null,
    manifestCounts:
      manifestSummaryForUi !== null
        ? {
            decisions: manifestSummaryForUi.decisionCount,
            warnings: manifestSummaryForUi.warningCount,
            unresolvedIssues: manifestSummaryForUi.unresolvedIssueCount,
          }
        : null,
    explanationSummary,
    quickDecisionFindings,
    severityLabelForFinding: severityBadgeLabel,
  });

  const sampleReviewPackageSummaryEl =
    usedStaticDemoRun ? (
      <SampleReviewPackageSummary
        runId={resolvedDetail.run.runId}
        manifestId={manifestId}
        artifactCount={artifacts.length}
        findingCount={findingCountDisplay}
      />
    ) : null;

  return (
    <div
      className={`mx-auto space-y-6 px-1 py-2 sm:px-0 ${buyerPolishedArtifactTable ? "max-w-6xl" : "max-w-4xl"}`}
    >
      <RunDetailBreadcrumb headline={headline} />

      {usedStaticDemoRun ? <OperatorDemoStaticBanner /> : null}

      <RunDetailPageHeader
        runSummary={runSummaryForBadge}
        runId={resolvedDetail.run.runId}
        headline={headline}
        hasGoldenManifest={Boolean(manifestId)}
        executionFlavorBuyerSummary={resolvedDetail.executionFlavorBuyerSummary}
        buyerGovernanceLine={
          buyerPolishedArtifactTable === true && manifestSummary !== null
            ? `Governance approval: ${governanceGateLabelFromManifestStatus(manifestSummary.status)}`
            : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <GenerateAdrFromRunModal input={adrGeneratorInput} />
      </div>

      <CompareToBaselineCta currentRunId={resolvedDetail.run.runId} />

      {usedStaticDemoRun && !buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {buyerPolishedArtifactTable && manifestId ? (
        <RunDetailExecutiveSummaryCtaCard runId={resolvedDetail.run.runId} />
      ) : null}

      <RunDetailOutcomeCards
        runId={resolvedDetail.run.runId}
        manifestId={manifestId}
        artifactCount={artifacts.length}
        findingCountDisplay={findingCountDisplay}
        warningCountDisplay={warningCountDisplay}
        hasGoldenManifest={Boolean(manifestId)}
        unresolvedIssueCountDisplay={manifestSummary?.unresolvedIssueCount ?? null}
        aggregateRiskPosture={explanationSummary?.riskPosture ?? null}
        governanceGateLabel={governanceGateLabel}
        showcasePolicyPackStrip={
          buyerPolishedArtifactTable &&
          manifestSummaryForUi !== null &&
          isShowcaseStaticDemoRunId(resolvedDetail.run.runId)
            ? {
                href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
                label: policyPackBuyerLabel(manifestSummaryForUi.ruleSetId, manifestSummaryForUi.ruleSetVersion),
              }
            : null
        }
      />

      {changesSinceLastReviewBannerEl}

      <RunEstimatedLlmCostCard estimate={resolvedDetail.agentExecutionLlmCostEstimate} />

      {usedStaticDemoRun && buyerPolishedArtifactTable ? sampleReviewPackageSummaryEl : null}

      {showProgressTracker ? (
        <RunProgressTracker runId={runId} initialSummary={progressForPipelineUi} />
      ) : null}

      <RunDetailSectionNav sections={runDetailNavSections} />

      {manifestId && resolvedDetail.trustEvidenceCard ? (
        <RunTrustEvidenceCardSection card={resolvedDetail.trustEvidenceCard} />
      ) : null}

      {manifestId && manifestSummaryForUi ? (
        <RunDetailManifestSummarySection
          manifestSummary={manifestSummaryForUi}
          buyerPolishedShell={buyerPolishedArtifactTable}
          runExecution={{
            realModeFellBackToSimulator: resolvedDetail.run.realModeFellBackToSimulator,
            pilotAoaiDeploymentSnapshot: resolvedDetail.run.pilotAoaiDeploymentSnapshot ?? null,
          }}
        />
      ) : null}

      {buyerPolishedArtifactTable && manifestId ? (
        <RunDetailRunExplanationCollapsible
          runId={runId}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
          quickDecisionFindings={quickDecisionFindings}
          findingWireSnapshots={findingWireSnapshots}
          findingCountDisplay={findingCountDisplay}
          warningCountDisplay={warningCountDisplay}
          explanationSummary={explanationSummary}
          explanationFailure={explanationFailure}
        />
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <RunDetailRunMetadataSection run={resolvedDetail.run} runDetailTraceId={runDetailTraceId} />
      ) : null}

      <RunDetailPipelineTimelineSection
        runId={runId}
        buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        pipelineTimelineFailure={pipelineTimelineFailure}
        pipelineTimelineForUi={pipelineTimelineForUi}
      />

      {resolvedDetail.run.graphSnapshotId ? (
        <RunDetailArchitectureGraphSection
          runId={runId}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <RunDetailAuthorityChainSection run={resolvedDetail.run} manifestId={manifestId} />
      ) : null}

      {!manifestId ? <RunDetailPreFinalizedEmptyState /> : null}

      <RunDetailManifestSummaryAlerts
        manifestSummaryFailure={manifestSummaryFailure}
        manifestSummaryMalformed={manifestSummaryMalformed}
      />

      {manifestId ? (
        <PostCommitRetentionRail
          runId={runId}
          showCompareCta={canShowCompareReviewButton}
          buyerShowcaseQuickLinks={usedStaticDemoRun}
          goldenManifestId={manifestId}
        />
      ) : null}

      {manifestId ? (
        <RunDetailArtifactsExportsSection
          manifestId={manifestId}
          runId={resolvedDetail.run.runId}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
          artifacts={artifacts}
          artifactsFailure={artifactsFailure}
          artifactsMalformed={artifactsMalformed}
          goldenManifestJsonForExport={goldenManifestJsonForExport}
          manifestSummaryForUi={manifestSummaryForUi}
          manifestSummary={manifestSummary}
          trustEvidenceCard={resolvedDetail.trustEvidenceCard}
          canShowCompareReviewButton={canShowCompareReviewButton}
        />
      ) : null}

      {!buyerPolishedArtifactTable && manifestId ? (
        <RunDetailRunExplanationCollapsible
          runId={runId}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
          quickDecisionFindings={quickDecisionFindings}
          findingWireSnapshots={findingWireSnapshots}
          findingCountDisplay={findingCountDisplay}
          warningCountDisplay={warningCountDisplay}
          explanationSummary={explanationSummary}
          explanationFailure={explanationFailure}
        />
      ) : null}

      {showPilotScorecardPackageCta && manifestId ? (
        <RunDetailSponsorBriefingSection
          runId={runId}
          manifestId={manifestId}
          curatedSampleRun={usedStaticDemoRun}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
      ) : null}

      {manifestId ? <BeforeAfterDeltaPanel variant="inline" runId={runId} /> : null}

      {manifestId ? (
        <RunDetailAdvancedAnalysisSection
          runId={runId}
          buyerPolishedArtifactTable={buyerPolishedArtifactTable}
        />
      ) : null}

      {!buyerPolishedArtifactTable ? <RunAgentForensicsSection runId={runId} /> : null}

      {!buyerPolishedArtifactTable ? (
        <RunDetailRunActionsSection runId={resolvedDetail.run.runId} manifestId={manifestId} />
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <RunDetailOperatorTechnicalFooter
          runId={resolvedDetail.run.runId}
          projectId={resolvedDetail.run.projectId}
          createdLabel={createdLabel}
        />
      ) : null}

      {!buyerPolishedArtifactTable ? (
        <RunDetailOperatorPipelineToolsCollapsible runId={resolvedDetail.run.runId} />
      ) : null}
    </div>
  );
}
