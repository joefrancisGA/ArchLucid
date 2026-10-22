import type { components } from "@/lib/openapi-schemas";
import type { PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import { isLiveAuthorityRunId } from "@/lib/operator-static-demo/run-scoped-live-api";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { architectureRequestBlockedReason } from "@/lib/runs/architecture-request-blocked-reason";
import { buyerRunDetailSummaryBlockedReason } from "@/lib/runs/buyer-run-detail-summary-blocked-reason";
import { runOperatorGovernanceDispositionMutationBlockedReason } from "@/lib/runs/run-operator-governance-disposition-mutation-blocked-reason";
import { runPipelineTimelineBlockedReason } from "@/lib/runs/run-pipeline-timeline-blocked-reason";
import { runReviewTrailBlockedReason } from "@/lib/runs/run-review-trail-blocked-reason";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  type ApiResponseWithTrace,
  apiGet,
  apiPostJson,
} from "./http";
import type {
  RunOperatorGovernanceDispositionRequest,
  RunOperatorGovernanceDispositionResponse,
} from "./architecture-runs-read-types";

/** Loads a persisted architecture request (constraints + intake answers for review calibration). */
export async function getArchitectureRequest(
  requestId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<components["schemas"]["ArchitectureRequest"]> {
  try {
    return await apiGetSealedManifestAware<components["schemas"]["ArchitectureRequest"]>(
      `/v1/architecture/request/${encodeURIComponent(requestId)}`,
      options,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureRequestBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Fetches the lightweight summary for a single run. */
export async function getRunSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunSummary> {
  if (!isLiveAuthorityRunId(runId)) {
    throw new Error(`Run id "${runId.trim()}" is not a live authority key.`);
  }

  try {
    return await apiGet<RunSummary>(`/v1/authority/reviews/${runId}/summary`, options);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runSummaryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Buyer-proof run detail — whitelisted fields only (TB-283). */
export async function getBuyerRunDetailSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ApiResponseWithTrace<RunDetail>> {
  try {
    const data = await apiGet<RunDetail>(`/v1/authority/reviews/${runId}/buyer-summary`, options);

    return { data, traceId: null };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = buyerRunDetailSummaryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** TB-112: record run-level approve / reject / request-remediation. */
export async function recordRunOperatorGovernanceDisposition(
  runId: string,
  body: RunOperatorGovernanceDispositionRequest,
): Promise<RunOperatorGovernanceDispositionResponse> {
  try {
    return await apiPostJson<RunOperatorGovernanceDispositionResponse>(
      `/v1/authority/reviews/${encodeURIComponent(runId)}/disposition`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runOperatorGovernanceDispositionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Authority pipeline stage outcomes (`GET /v1/architecture/review/{runId}/stage-timeline`, TB-250). */
export async function getRunStageTimeline(runId: string): Promise<StageTimelineSummary[]> {
  try {
    return await apiGetSealedManifestAware<StageTimelineSummary[]>(
      `/v1/architecture/review/${encodeURIComponent(runId)}/stage-timeline`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runPipelineTimelineBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Run-scoped audit events oldest-first (pipeline / lifecycle timeline for operators). */
export async function getRunPipelineTimeline(runId: string): Promise<PipelineTimelineItem[]> {
  try {
    return await apiGetSealedManifestAware<PipelineTimelineItem[]>(
      `/v1/authority/reviews/${runId}/pipeline-timeline`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runPipelineTimelineBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Canonical product review-trail list (`GET /v1/runs/{runId}/review-trail`). */
export async function getReviewTrail(runId: string): Promise<PipelineTimelineItem[]> {
  try {
    return await apiGetSealedManifestAware<PipelineTimelineItem[]>(
      `/v1/runs/${encodeURIComponent(runId)}/review-trail`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runReviewTrailBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
