import type { components } from "@/lib/openapi-schemas";
import type {
  ArtifactDescriptor,
  DecisionProvenanceGraph,
  ManifestSummary,
  PipelineTimelineItem,
  RunDetail,
  RunExplanationSummary,
  RunSummary,
} from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationSummaryPayload,
  RunRetrievalGroundingPayload,
} from "@/types/agent-forensics";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import { isLiveAuthorityRunId } from "@/lib/operator-static-demo/run-scoped-live-api";

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];
import {
  type ApiGetOptions,
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
  apiPostJson,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

/** Linkage graph + trace timeline for a coordinator architecture run. */
export async function getArchitectureRunProvenance(
  runId: string,
): Promise<ApiResponseWithTrace<ArchitectureRunProvenanceGraph>> {
  return apiGetJsonWithTrace<ArchitectureRunProvenanceGraph>(
    `/v1/architecture/reviews/${encodeURIComponent(runId)}/provenance`,
  );
}

/** Lists recent runs for a project (GET /v1/authority/projects/{id}/reviews). */
export async function listRunsByProject(projectId: string, take = 20): Promise<RunSummary[]> {
  return apiGet<RunSummary[]>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/reviews?take=${take}`,
  );
}

/**
 * True when the Reviews hub (and similar inventories) should list every authority project slug in scope.
 * Create maps system name → run project slug, so listing only `default` hides real packages.
 */
export function shouldListReviewsAcrossProjectSlugs(projectId: string | null | undefined): boolean {
  const trimmed = projectId?.trim() ?? "";

  return trimmed.length === 0 || trimmed.toLowerCase() === "default";
}

/**
 * Paged runs for a project (GET — always Authority keyset `cursor`+`take`; do not send page/pageSize).
 * `page` remains in the signature for call-site compatibility; only `pageSize` maps to `take`.
 */
export async function listRunsByProjectPaged(
  projectId: string,
  page: number,
  pageSize: number,
  options?: {
    readonly cursor?: string | null;
    readonly scopeHeaders?: Record<string, string>;
  },
): Promise<PagedResponse<RunSummary>> {
  void page;
  const q = new URLSearchParams();
  q.set("take", String(pageSize));
  q.set("cursor", options?.cursor ?? "");

  // Do not send includeArchived: GET /v1/authority/projects/{id}/reviews does not declare it.
  // OpenApiUndeclaredQueryParameterFilter returns 400 "Unknown query parameter 'includeArchived'".
  // List SQL already excludes ArchivedUtc until a declared API ships.

  return apiGet<PagedResponse<RunSummary>>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/reviews?${q}`,
    options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
  );
}

/**
 * Paged runs across all authority project slugs in the current scope
 * (`GET /v1/authority/reviews` — always keyset `cursor`+`take`, same envelope as project-scoped list).
 */
export async function listRunsInScopePaged(
  page: number,
  pageSize: number,
  options?: {
    readonly cursor?: string | null;
    readonly scopeHeaders?: Record<string, string>;
  },
): Promise<PagedResponse<RunSummary>> {
  void page;
  const q = new URLSearchParams();
  q.set("take", String(pageSize));
  q.set("cursor", options?.cursor ?? "");

  return apiGet<PagedResponse<RunSummary>>(
    `/v1/authority/reviews?${q}`,
    options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
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

/** Fetches golden manifest summary (decision count, warnings, status, etc.). */
export async function getManifestSummary(
  manifestId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ManifestSummary> {
  return apiGet<ManifestSummary>(`/v1/authority/signed-review-records/${manifestId}/summary`, options);
}

/** Lists all synthesized artifacts for a manifest (metadata only, no binary content). */
export async function listArtifacts(
  manifestId: string,
  options?: ApiGetOptions,
): Promise<ArtifactDescriptor[]> {
  return apiGet<ArtifactDescriptor[]>(`/v1/artifacts/signed-review-records/${manifestId}`, options);
}

/** JSON metadata for one artifact (no binary download). */
export async function getArtifactDescriptor(
  manifestId: string,
  artifactId: string,
): Promise<ArtifactDescriptor> {
  return apiGet<ArtifactDescriptor>(
    `/v1/artifacts/signed-review-records/${manifestId}/artifact/${artifactId}/descriptor`,
  );
}

/** In-shell preview cap; artifacts larger than this are truncated for the review panel. */
const DEFAULT_ARTIFACT_PREVIEW_MAX_BYTES = 2 * 1024 * 1024;

/** Result of fetching artifact binary content and decoding it as UTF-8 for in-shell preview. */
export type ArtifactContentFetchResult = {
  text: string;
  contentType: string;
  byteLength: number;
  truncated: boolean;
};

/**
 * Fetches artifact bytes from the download endpoint and decodes as UTF-8 for in-shell review.
 * Large artifacts are truncated deterministically for the preview panel (download remains full file).
 */
export async function fetchArtifactContentUtf8(
  manifestId: string,
  artifactId: string,
  maxBytes: number = DEFAULT_ARTIFACT_PREVIEW_MAX_BYTES,
): Promise<ArtifactContentFetchResult> {
  await ensureOidcBearerReady();
  const path = `/v1/artifacts/signed-review-records/${encodeURIComponent(manifestId)}/artifact/${encodeURIComponent(artifactId)}`;
  const { url, headers } = await resolveBinaryGetRequest(path);
  const h = withCorrelationHeaders(headers);
  const response = await fetch(url, {
    cache: "no-store",
    headers: h,
  });

  if (!response.ok) {
    const text = await response.text();
    throwApiRequestError(response, text);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await response.arrayBuffer();
  const byteLength = buffer.byteLength;
  let truncated = false;
  let slice = buffer;

  if (byteLength > maxBytes) {
    truncated = true;
    slice = buffer.slice(0, maxBytes);
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);

  return {
    text,
    contentType,
    byteLength,
    truncated,
  };
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

export type {
  CreateArchitectureRunDocumentPayload,
  CreateArchitectureRunInfrastructureDeclarationPayload,
  CreateArchitectureRunRequestPayload,
  CreateArchitectureRunResponsePayload,
  CreateArchitectureRunAsyncResult,
  ExecuteArchitectureRunAsyncResult,
} from "./architecture-runs-mutate";

export {
  createArchitectureRunAsync,
  createArchitectureRun,
  pinArchitectureRun,
  commitArchitectureRun,
  executeArchitectureRun,
  executeArchitectureRunAsync,
  executeArchitectureRunSelective,
  seedFakeArchitectureRunResults,
  restoreArchitectureRequest,
} from "./architecture-runs-mutate";

export {
  compareRunsEndToEnd,
  compareRuns,
  compareGoldenManifestRuns,
  explainComparisonRuns,
  explainRun,
  getFirstValueReportMarkdown,
} from "./architecture-runs-compare";
