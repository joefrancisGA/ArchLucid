import type { components } from "@/lib/openapi-schemas";
import type {
  DecisionProvenanceGraph,
  PipelineTimelineItem,
  RunDetail,
  RunSummary,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationSummaryPayload,
  RunRetrievalGroundingPayload,
} from "@/types/agent-forensics";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import { isLiveAuthorityRunId } from "@/lib/operator-static-demo/run-scoped-live-api";

import {
  type ApiGetOptions,
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
  apiPostJson,
} from "./http";

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];

/** Linkage graph + trace timeline for a coordinator architecture run. */
export async function getArchitectureRunProvenance(
  runId: string,
): Promise<ApiResponseWithTrace<ArchitectureRunProvenanceGraph>> {
  return apiGetJsonWithTrace<ArchitectureRunProvenanceGraph>(
    `/v1/architecture/reviews/${encodeURIComponent(runId)}/provenance`,
  );
}

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

/** Fetches the full run detail envelope (run metadata, snapshots, manifest, trace, bundle). */
export async function getRunDetail(
  runId: string,
  options?: ApiGetOptions,
): Promise<ApiResponseWithTrace<RunDetail>> {
  if (!isLiveAuthorityRunId(runId)) {
    throw new Error(`Run id "${runId.trim()}" is not a live authority key.`);
  }

  return apiGetJsonWithTrace<RunDetail>(`/v1/authority/reviews/${runId}`, options);
}

/** Buyer-proof run detail — whitelisted fields only (TB-283). */
export async function getBuyerRunDetailSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ApiResponseWithTrace<RunDetail>> {
  return apiGetJsonWithTrace<RunDetail>(`/v1/authority/reviews/${runId}/buyer-summary`, options);
}

export type RunOperatorGovernanceDispositionRequest = {
  decision: "Approved" | "Rejected" | "RequestRemediation";
  rationale?: string | null;
};

export type RunOperatorGovernanceDispositionResponse = {
  runId: string;
  decision: RunOperatorGovernanceDispositionRequest["decision"];
  rationale?: string | null;
  occurredAtUtc: string;
  recordedByUserId: string;
};

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

/** Structural provenance graph for a completed authority run (422 if snapshots incomplete). */
export async function getRunProvenance(runId: string): Promise<DecisionProvenanceGraph> {
  return apiGet<DecisionProvenanceGraph>(`/v1/authority/reviews/${runId}/provenance`);
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

/** Paginated agent execution traces (LLM audit rows) for a coordinator architecture run. */
export async function getRunTraces(
  runId: string,
  pageNumber = 1,
  pageSize = 50,
): Promise<ApiResponseWithTrace<AgentExecutionTraceListPayload>> {
  const q = new URLSearchParams();
  q.set("pageNumber", String(pageNumber));
  q.set("pageSize", String(pageSize));

  return apiGetJsonWithTrace<AgentExecutionTraceListPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/traces?${q}`,
  );
}

/** Trace-derived redacted invocation forensics (TB-110). */
export async function getRunToolInvocationForensics(
  runId: string,
): Promise<ApiResponseWithTrace<RunToolInvocationForensicsPayload>> {
  return apiGetJsonWithTrace<RunToolInvocationForensicsPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/tool-invocation-forensics`,
  );
}

/** On-demand structural evaluation of persisted `parsedResultJson` per trace (no OTel side effects in API). */
export async function getRunAgentEvaluation(
  runId: string,
): Promise<ApiResponseWithTrace<AgentOutputEvaluationSummaryPayload>> {
  return apiGetJsonWithTrace<AgentOutputEvaluationSummaryPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/agent-evaluation`,
  );
}

/** Redaction-safe retrieval grounding diagnostics for one authority run. */
export async function getRunRetrievalGrounding(
  runId: string,
): Promise<ApiResponseWithTrace<RunRetrievalGroundingPayload>> {
  return apiGetJsonWithTrace<RunRetrievalGroundingPayload>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/retrieval-grounding`,
  );
}

/** Latest authority manifest document JSON for a run (`GET /v1/authority/reviews/{runId}/signed-review-record`). */
export async function getAuthorityRunManifest(runId: string): Promise<unknown> {
  return apiGet<unknown>(`/v1/authority/reviews/${encodeURIComponent(runId)}/signed-review-record`);
}

/** Aggregate sponsor explanation (themes, posture, counts) with nested full explanation payload. */
export async function getRunExplanationSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunExplanationSummary> {
  return apiGet<RunExplanationSummary>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/aggregate`,
    options,
  );
}
