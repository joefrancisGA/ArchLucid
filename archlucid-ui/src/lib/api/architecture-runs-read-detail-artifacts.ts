import type {
  DecisionProvenanceGraph,
  RunDetail,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationSummaryPayload,
  RunRetrievalGroundingPayload,
} from "@/types/agent-forensics";

import { isLiveAuthorityRunId } from "@/lib/operator-static-demo/run-scoped-live-api";

import {
  type ApiGetOptions,
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
} from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import type { RunToolInvocationForensicsPayload } from "./architecture-runs-read-types";

/** Linkage graph + trace timeline for a coordinator architecture run. */
export async function getArchitectureRunProvenance(
  runId: string,
): Promise<ArchitectureRunProvenanceGraph> {
  return apiGetSealedManifestAware<ArchitectureRunProvenanceGraph>(
    `/v1/architecture/reviews/${encodeURIComponent(runId)}/provenance`,
  );
}

/** Fetches the full run detail envelope (run metadata, snapshots, manifest, trace, bundle). */
export async function getRunDetail(
  runId: string,
  options?: ApiGetOptions,
): Promise<ApiResponseWithTrace<RunDetail>> {
  if (!isLiveAuthorityRunId(runId)) {
    throw new Error(`Run id "${runId.trim()}" is not a live authority key.`);
  }

  return apiGetSealedManifestAware<RunDetail>(
    `/v1/runs/${runId}`,
    options,
  ).then((data) => ({ data, traceId: null }));
}

/** Structural provenance graph for a completed authority run (422 if snapshots incomplete). */
export async function getRunProvenance(runId: string): Promise<DecisionProvenanceGraph> {
  return apiGetSealedManifestAware<DecisionProvenanceGraph>(`/v1/authority/reviews/${runId}/provenance`);
}

/** Paginated agent execution traces (LLM audit rows) for a coordinator architecture run. */
export async function getRunTraces(
  runId: string,
  pageNumber = 1,
  pageSize = 50,
): Promise<AgentExecutionTraceListPayload> {
  const q = new URLSearchParams();
  q.set("pageNumber", String(pageNumber));
  q.set("pageSize", String(pageSize));

  return apiGetSealedManifestAware<AgentExecutionTraceListPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/traces?${q}`,
  );
}

/** Trace-derived redacted invocation forensics (TB-110). */
export async function getRunToolInvocationForensics(
  runId: string,
): Promise<RunToolInvocationForensicsPayload> {
  return apiGetSealedManifestAware<RunToolInvocationForensicsPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/tool-invocation-forensics`,
  );
}

/** On-demand structural evaluation of persisted `parsedResultJson` per trace (no OTel side effects in API). */
export async function getRunAgentEvaluation(
  runId: string,
): Promise<AgentOutputEvaluationSummaryPayload> {
  return apiGetSealedManifestAware<AgentOutputEvaluationSummaryPayload>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/agent-evaluation`,
  );
}

/** Redaction-safe retrieval grounding diagnostics for one authority run. */
export async function getRunRetrievalGrounding(
  runId: string,
): Promise<RunRetrievalGroundingPayload> {
  return apiGetSealedManifestAware<RunRetrievalGroundingPayload>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/retrieval-grounding`,
  );
}

/** Latest authority manifest document JSON for a run (`GET /v1/authority/reviews/{runId}/signed-review-record`). */
export async function getAuthorityRunManifest(runId: string): Promise<unknown> {
  return apiGetSealedManifestAware<unknown>(
    `/v1/authority/reviews/${encodeURIComponent(runId)}/signed-review-record`,
  );
}

/** Aggregate sponsor explanation (themes, posture, counts) with nested full explanation payload. */
export async function getRunExplanationSummary(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<RunExplanationSummary> {
  return apiGetSealedManifestAware<RunExplanationSummary>(
    `/v1/explain/runs/${encodeURIComponent(runId)}/aggregate`,
    options,
  );
}
