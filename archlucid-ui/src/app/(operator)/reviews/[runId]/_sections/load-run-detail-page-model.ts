import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
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
import { buildAdrGeneratorRunInput } from "@/lib/adr-from-run";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { deriveChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { isUsableGoldenManifestExportJson } from "@/lib/export-markdown";
import { findPriorCommittedRun } from "@/lib/find-prior-committed-run";
import { buyerGovernanceApprovalDisplayLabel, governanceGateLabelFromManifestStatus } from "@/lib/governance-gate-display";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
  coerceRunComparison,
  coerceRunDetail,
} from "@/lib/operator-response-guards";
import {
  tryStaticDemoArtifacts,
  tryStaticDemoExplanationSummary,
  tryStaticDemoGoldenManifestJsonForExport,
  tryStaticDemoManifestSummary,
  tryStaticDemoPipelineTimeline,
  tryStaticDemoRunDetail,
} from "@/lib/operator-static-demo";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  buildFindingWireSnapshotsForRunDetail,
  resolveQuickDecisionFindingsForRunDetail,
  severityBadgeLabel,
} from "@/lib/quick-decision-summary-derive";
import { resolveReviewOutcomeCounts } from "@/lib/review-outcome-counts";
import { loadRunSavingsSummaryModel } from "@/lib/run-savings-summary-model";
import { effectiveRunSummaryForPipeline } from "@/lib/run-summary-from-detail";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
} from "@/lib/showcase-static-demo";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { buildRunDetailNavSections } from "./build-run-detail-nav-sections";
import { pipelineCompleteOnSummary } from "./pipeline-complete-on-summary";
import type { RunDetailChangesSinceLastReviewBanner, RunDetailPageModel } from "./run-detail-page-model";

export type LoadRunDetailPageModelResult =
  | { kind: "not-found" }
  | { kind: "fetch-error"; loadFailure: ApiLoadFailureState | null; fallbackMessage: string }
  | { kind: "malformed-response"; message: string }
  | { kind: "success"; model: RunDetailPageModel };

/** Fetches and coerces run-detail plus dependent resources for the run detail route. */
export async function loadRunDetailPageModel(runId: string): Promise<LoadRunDetailPageModelResult> {
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
        return { kind: "not-found" };
      }
    }
  }

  if (loadFailure !== null || runDetailResponse === null) {
    const fallback = loadFailure?.message ?? "Review not found or could not be loaded.";

    return {
      kind: "fetch-error",
      loadFailure,
      fallbackMessage: fallback,
    };
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
    return { kind: "malformed-response", message: envelope.message };
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

  let changesSinceLastReviewBanner: RunDetailChangesSinceLastReviewBanner | null = null;

  if (manifestId !== undefined && manifestId !== null && manifestId.trim().length > 0 && priorCommittedRun !== null) {
    try {
      const rawCompare: unknown = await compareRuns(priorCommittedRun.runId, resolvedDetail.run.runId);
      const coercedCmp = coerceRunComparison(rawCompare);

      if (coercedCmp.ok) {
        const copy = deriveChangesSinceLastReviewCopy(coercedCmp.value);

        if (copy !== null) {
          changesSinceLastReviewBanner = {
            priorReviewDateLabel: formatInstantForLocale(priorCommittedRun.createdUtc),
            priorRunId: priorCommittedRun.runId,
            currentRunId: resolvedDetail.run.runId,
            copy,
          };
        }
      }
    } catch {
      changesSinceLastReviewBanner = null;
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

  const governanceGateLabelRaw =
    manifestSummary !== null ? governanceGateLabelFromManifestStatus(manifestSummary.status) : null;

  const governanceGateLabel =
    governanceGateLabelRaw !== null && buyerPolishedArtifactTable
      ? buyerGovernanceApprovalDisplayLabel(governanceGateLabelRaw)
      : governanceGateLabelRaw;

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

  const savingsSummary = await loadRunSavingsSummaryModel({
    artifacts,
    manifestId,
    routeRunId: runId,
    usedStaticDemoRun,
  });

  const model: RunDetailPageModel = {
    routeRunId: runId,
    resolvedDetail,
    runDetailTraceId,
    buyerPolishedArtifactTable,
    usedStaticDemoRun,
    manifestId,
    headline,
    createdLabel,
    canShowCompareReviewButton,
    changesSinceLastReviewBanner,
    goldenManifestJsonForExport,
    progressForPipelineUi,
    showProgressTracker,
    manifestSummary,
    manifestSummaryForUi,
    manifestSummaryFailure,
    manifestSummaryMalformed,
    artifacts,
    artifactsFailure,
    artifactsMalformed,
    explanationSummary,
    explanationFailure,
    pipelineTimelineForUi,
    pipelineTimelineFailure,
    runDetailNavSections,
    findingCountDisplay,
    warningCountDisplay,
    showPilotScorecardPackageCta,
    governanceGateLabel,
    quickDecisionFindings,
    findingWireSnapshots,
    adrGeneratorInput,
    savingsSummary,
  };

  return { kind: "success", model };
}
