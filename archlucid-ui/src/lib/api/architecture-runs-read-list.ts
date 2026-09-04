import type { components } from "@/lib/openapi-schemas";
import type { PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import { isLiveAuthorityRunId } from "@/lib/operator-static-demo/run-scoped-live-api";

import {
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
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
  return apiGet<components["schemas"]["ArchitectureRequest"]>(
    `/v1/architecture/request/${encodeURIComponent(requestId)}`,
    options,
  );
}

/** Fetches the lightweight summary for a single run. */
export async function getRunSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunSummary> {
  if (!isLiveAuthorityRunId(runId)) {
    throw new Error(`Run id "${runId.trim()}" is not a live authority key.`);
  }

  return apiGet<RunSummary>(`/v1/authority/reviews/${runId}/summary`, options);
}

/** Buyer-proof run detail — whitelisted fields only (TB-283). */
export async function getBuyerRunDetailSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ApiResponseWithTrace<RunDetail>> {
  return apiGetJsonWithTrace<RunDetail>(`/v1/authority/reviews/${runId}/buyer-summary`, options);
}

/** TB-112: record run-level approve / reject / request-remediation. */
export async function recordRunOperatorGovernanceDisposition(
  runId: string,
  body: RunOperatorGovernanceDispositionRequest,
): Promise<RunOperatorGovernanceDispositionResponse> {
  return apiPostJson<RunOperatorGovernanceDispositionResponse>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/disposition`,
    body,
  );
}

/** Authority pipeline stage outcomes (`GET /v1/architecture/review/{runId}/stage-timeline`, TB-250). */
export async function getRunStageTimeline(runId: string): Promise<StageTimelineSummary[]> {
  return apiGet<StageTimelineSummary[]>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/stage-timeline`,
  );
}

/** Run-scoped audit events oldest-first (pipeline / lifecycle timeline for operators). */
export async function getRunPipelineTimeline(runId: string): Promise<PipelineTimelineItem[]> {
  return apiGet<PipelineTimelineItem[]>(`/v1/authority/reviews/${runId}/pipeline-timeline`);
}
