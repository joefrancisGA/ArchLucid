import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { isBrowser } from "@/lib/api/http";
import {
  type ApiResponseWithTrace,
  getManifestSummary,
  getBuyerRunDetailSummary,
  getRunSummary,
  listArtifacts,
} from "@/lib/api";
import { buildAdrGeneratorRunInput } from "@/lib/adr-from-run";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isPinnedDemoWorkspaceRunId } from "@/lib/demo-workspace-scope";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { isUsableGoldenManifestExportJson } from "@/lib/export-markdown";
import { buyerGovernanceApprovalDisplayLabel, governanceGateLabelFromManifestStatus } from "@/lib/governance/governance-gate-display";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { isManifestCommittedForPilotScorecardPackage } from "@/lib/pilot-scorecard-package-eligibility";
import { stripRetiredDemoOrgBranding } from "@/lib/retired-demo-org-branding";
import {
  coerceArtifactDescriptorList,
  coerceManifestSummary,
  coerceRunDetail,
} from "@/lib/operator-response-guards";
import {
  tryStaticDemoArtifacts,
  tryStaticDemoGoldenManifestJsonForExport,
  tryStaticDemoManifestSummary,
  tryStaticDemoRunDetail,
} from "@/lib/operator-static-demo";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  resolveQuickDecisionFindingsForRunDetail,
  severityBadgeLabel,
} from "@/lib/quick-decision-summary-derive";
import { mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings } from "@/lib/run-detail-findings-hydration";
// NOTE: quickDecisionFindings is computed only for the ADR generator input; it is not part of the
// critical-path RunDetailPageModel so the heavy finding scan doesn't block first-screen rendering.
import { resolveReviewOutcomeCounts } from "@/lib/review-outcome-counts";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { resolveServerScopeHeadersForRun } from "@/lib/server-run-scope";
import {
  projectIdFromScopeHeaders,
  runProjectMatchesEffectiveScope,
} from "@/lib/operator-resource-scope";
import { effectiveRunSummaryForPipeline } from "@/lib/run-summary-from-detail";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
} from "@/lib/showcase-static-demo";
import type { ArtifactDescriptor, ManifestSummary, RunDetail, RunSummary } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { buildRunDetailNavSections } from "./build-run-detail-nav-sections";
import { pipelineCompleteOnSummary } from "./pipeline-complete-on-summary";
import type { RunDetailPageModel } from "./run-detail-page-model";

export type RunDetailNotFoundReason = "missing" | "workspace-mismatch";

export type LoadRunDetailPageModelResult =
  | { kind: "not-found"; reason: RunDetailNotFoundReason }
  | { kind: "fetch-error"; loadFailure: ApiLoadFailureState | null; fallbackMessage: string }
  | { kind: "malformed-response"; message: string }
  | { kind: "success"; model: RunDetailPageModel };

/** Fetches and coerces run-detail plus dependent resources for the run detail route. */
export async function loadRunDetailPageModel(runId: string): Promise<LoadRunDetailPageModelResult> {
  let runDetailResponse: ApiResponseWithTrace<RunDetail> | null = null;
  let loadFailure: ApiLoadFailureState | null = null;
  let usedStaticDemoRun = false;

  const serverScopeHeaders = isBrowser() ? null : await resolveServerScopeHeadersForRun(runId);
  const apiScopeOptions =
    serverScopeHeaders !== null ? { scopeHeaders: serverScopeHeaders } : undefined;

  // These two fetches only need runId, so they start alongside the run-detail fetch instead of
  // after it — collapsing the former two-phase network waterfall. Both loaders swallow their own
  // failures, so the floating promises are safe when the run-detail fetch short-circuits below.
  const progressSummaryPromise = getRunSummary(runId).catch(() => null);

  // TB-2022: always slim buyer-summary for first paint (no fat PayloadJson/ResultJson).
  // Inspect/export keep GET /v1/authority/reviews/{id}. UI chrome density still uses isBuyerPolishedOperatorShellEnv.
  const usedBuyerRunDetailSummary = true;

  try {
    runDetailResponse = await getBuyerRunDetailSummary(runId, apiScopeOptions);
  } catch (e) {
    const fallback = tryStaticDemoRunDetail(runId);

    if (fallback !== null) {
      runDetailResponse = { data: fallback, traceId: null };
      loadFailure = null;
      usedStaticDemoRun = true;
    } else {
      loadFailure = toApiLoadFailure(e);

      if (isApiNotFoundFailure(loadFailure)) {
        return { kind: "not-found", reason: "missing" };
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

  let resolvedDetail = envelope.value;

  if (usedBuyerRunDetailSummary) {
    resolvedDetail = await mergeRunDetailAgentResultsWhenBuyerSummaryOmitsFindings(
      runId,
      resolvedDetail,
      apiScopeOptions,
    );
  }

  const effectiveScopeHeaders = isBrowser()
    ? getEffectiveBrowserProxyScopeHeaders()
    : serverScopeHeaders!;
  const effectiveProjectId = projectIdFromScopeHeaders(effectiveScopeHeaders);

  if (
    !isPinnedDemoWorkspaceRunId(runId)
    && !isShowcaseStaticDemoRunId(runId)
    && !runProjectMatchesEffectiveScope(resolvedDetail.run.scopeProjectId, effectiveProjectId)
  ) {
    return { kind: "not-found", reason: "workspace-mismatch" };
  }

  const buyerPolishedArtifactTable = isBuyerPolishedOperatorShellEnv();

  const manifestId = resolvedDetail.run.goldenManifestId;

  let goldenManifestJsonForExport: unknown | null = null;

  if (isUsableGoldenManifestExportJson(resolvedDetail.goldenManifest)) {
    goldenManifestJsonForExport = resolvedDetail.goldenManifest;
  } else if (usedStaticDemoRun) {
    goldenManifestJsonForExport = tryStaticDemoGoldenManifestJsonForExport(runId);
  }

  const runDetailTraceId = runDetailResponse.traceId;

  let progressInitialSummary: RunSummary | null = null;

  let manifestSummary: ManifestSummary | null = null;
  let artifacts: ArtifactDescriptor[] = [];
  let manifestSummaryFailure: ApiLoadFailureState | null = null;
  let manifestSummaryMalformed: string | null = null;
  let artifactsFailure: ApiLoadFailureState | null = null;
  let artifactsMalformed: string | null = null;
  const explanationSummary: RunExplanationSummary | null = null;
  const explanationFailure: ApiLoadFailureState | null = null;

  if (manifestId) {
    const [resolvedProgressSummary, manifestSummaryResult, artifactsResult] = await Promise.all([
      progressSummaryPromise,
      loadRunDetailManifestSummary(manifestId, apiScopeOptions),
      loadRunDetailArtifacts(runId, manifestId, apiScopeOptions),
    ]);

    progressInitialSummary = resolvedProgressSummary;
    manifestSummary = manifestSummaryResult.summary;
    manifestSummaryFailure = manifestSummaryResult.failure;
    manifestSummaryMalformed = manifestSummaryResult.malformed;
    artifacts = artifactsResult.artifacts;
    artifactsFailure = artifactsResult.failure;
    artifactsMalformed = artifactsResult.malformed;
  } else {
    progressInitialSummary = await progressSummaryPromise;
  }

  const progressForPipelineUi = effectiveRunSummaryForPipeline(progressInitialSummary, resolvedDetail);

  const showProgressTracker =
    !manifestId || !pipelineCompleteOnSummary(progressForPipelineUi);

  const buyerPolishedSections = buyerPolishedArtifactTable;

  const runDetailNavSections = buildRunDetailNavSections({
    buyerPolishedSections,
    manifestSummary,
    trustEvidenceCard: resolvedDetail.trustEvidenceCard,
    manifestId,
    graphSnapshotId:
      resolvedDetail.run.graphSnapshotId ??
      ((resolvedDetail.run as { hasGraphSnapshot?: boolean }).hasGraphSnapshot ? "present" : undefined),
  });

  const descriptionTrimmed = stripRetiredDemoOrgBranding(resolvedDetail.run.description).trim();

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

  const quickDecisionFindingsForAdr = resolveQuickDecisionFindingsForRunDetail(resolvedDetail, explanationSummary);

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
    quickDecisionFindings: quickDecisionFindingsForAdr,
    severityLabelForFinding: severityBadgeLabel,
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
    runDetailNavSections,
    findingCountDisplay,
    warningCountDisplay,
    showPilotScorecardPackageCta,
    governanceGateLabel,
    adrGeneratorInput,
  };

  return { kind: "success", model };
}

type RunDetailManifestSummaryLoadResult = {
  summary: ManifestSummary | null;
  failure: ApiLoadFailureState | null;
  malformed: string | null;
};

type RunDetailArtifactsLoadResult = {
  artifacts: ArtifactDescriptor[];
  failure: ApiLoadFailureState | null;
  malformed: string | null;
};

async function loadRunDetailManifestSummary(
  manifestId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetailManifestSummaryLoadResult> {
  try {
    const rawSummary: unknown = await getManifestSummary(manifestId, options);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (!coercedSummary.ok) {
      return { summary: null, failure: null, malformed: coercedSummary.message };
    }

    return { summary: coercedSummary.value, failure: null, malformed: null };
  } catch (e) {
    const staticSummary = tryStaticDemoManifestSummary(manifestId);

    if (staticSummary !== null) {
      return { summary: staticSummary, failure: null, malformed: null };
    }

    return { summary: null, failure: toApiLoadFailure(e), malformed: null };
  }
}

async function loadRunDetailArtifacts(
  runId: string,
  manifestId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunDetailArtifactsLoadResult> {
  try {
    const rawArtifacts: unknown = await listArtifacts(manifestId, options);
    const coercedArtifacts = coerceArtifactDescriptorList(rawArtifacts);

    if (!coercedArtifacts.ok) {
      return { artifacts: [], failure: null, malformed: coercedArtifacts.message };
    }

    return { artifacts: coercedArtifacts.items, failure: null, malformed: null };
  } catch (e) {
    const staticArtifacts = tryStaticDemoArtifacts(runId, manifestId);

    if (staticArtifacts !== null) {
      return { artifacts: staticArtifacts, failure: null, malformed: null };
    }

    return { artifacts: [], failure: toApiLoadFailure(e), malformed: null };
  }
}
