import type { components } from "@/lib/openapi-schemas";
import type { GoldenManifestComparison } from "@/types/comparison";
import type {
  ComparisonExplanation,
  RunExplanation,
  RunExplanationSummary,
} from "@/types/explanation";
import type {
  ArtifactDescriptor,
  DecisionProvenanceGraph,
  ManifestSummary,
  PipelineTimelineItem,
  RunComparison,
  RunDetail,
  RunSummary,
} from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type {
  AgentExecutionTraceListPayload,
  AgentOutputEvaluationSummaryPayload,
  RunRetrievalGroundingPayload,
  RunToolInvocationForensicsPayload,
} from "@/types/agent-forensics";
import { getOrCreateWizardIdempotencyKey } from "@/lib/wizard-idempotency-key";
import {
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
  apiPatchJson,
  apiPostJson,
  apiPostNoContent,
  ensureOidcBearerReady,
  resolveBinaryGetRequest,
  resolveRequest,
  throwApiRequestError,
  withCorrelationHeaders,
} from "./http";

/** Attached context document (camelCase JSON — matches API `ContextDocumentRequest`). */
export type CreateArchitectureRunDocumentPayload = {
  name: string;
  contentType: string;
  content: string;
};

/** IaC / declaration blob (camelCase JSON — matches API `InfrastructureDeclarationRequest`). */
export type CreateArchitectureRunInfrastructureDeclarationPayload = {
  name: string;
  format: string;
  content: string;
};

/** Body shape for POST /v1/architecture/request (operator wizard + full `ArchitectureRequest` surface). */
export type CreateArchitectureRunRequestPayload = {
  requestId: string;
  description: string;
  systemName: string;
  environment: string;
  cloudProvider: "Azure" | "Aws" | "Gcp";
  constraints: string[];
  requiredCapabilities: string[];
  assumptions: string[];
  priorManifestVersion?: string;
  inlineRequirements?: string[];
  documents?: CreateArchitectureRunDocumentPayload[];
  policyReferences?: string[];
  topologyHints?: string[];
  securityBaselineHints?: string[];
  infrastructureDeclarations?: CreateArchitectureRunInfrastructureDeclarationPayload[];
};

/** Response envelope for POST /v1/architecture/request. */
export type CreateArchitectureRunResponsePayload =
  components["schemas"]["CreateArchitectureRunResponse"];

/** Submits a new architecture run (POST /v1/architecture/request). */
export async function createArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  options?: { readonly idempotencyKey?: string },
): Promise<CreateArchitectureRunResponsePayload> {
  const idempotencyKey = options?.idempotencyKey?.trim() || getOrCreateWizardIdempotencyKey();

  return apiPostJson<CreateArchitectureRunResponsePayload>("/v1/architecture/request", body, {
    extraHeaders: { "Idempotency-Key": idempotencyKey },
  });
}

/** Pins or unpins a run (PATCH /v1/architecture/run/{runId}/pin). Omit `isPinned` to toggle. */
export async function pinArchitectureRun(
  runId: string,
  body: { readonly isPinned?: boolean } = {},
): Promise<{ runId: string; isPinned: boolean }> {
  return apiPatchJson<{ runId: string; isPinned: boolean }>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/pin`,
    body,
  );
}

/** Commits agent results into a golden manifest (POST /v1/architecture/run/{runId}/commit). */
export async function commitArchitectureRun(
  runId: string,
  options?: { readonly notifySponsor?: boolean },
): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/run/${encodeURIComponent(runId)}/commit`, {
    notifySponsor: options?.notifySponsor === true,
  });
}

/** Seeds deterministic fake agent results for a run (POST /v1/internal/architecture/runs/{runId}/seed-fake-results; operator + ExecuteAuthority). */
export async function seedFakeArchitectureRunResults(runId: string): Promise<{ resultCount?: number }> {
  return apiPostJson<{ resultCount?: number }>(
    `/v1/internal/architecture/runs/${encodeURIComponent(runId)}/seed-fake-results`,
    {},
  );
}

/** Linkage graph + trace timeline for a coordinator architecture run. */
export async function getArchitectureRunProvenance(
  runId: string,
): Promise<ApiResponseWithTrace<ArchitectureRunProvenanceGraph>> {
  return apiGetJsonWithTrace<ArchitectureRunProvenanceGraph>(
    `/v1/architecture/runs/${encodeURIComponent(runId)}/provenance`,
  );
}

/** Lists recent runs for a project (GET /v1/authority/projects/{id}/runs). */
export async function listRunsByProject(projectId: string, take = 20): Promise<RunSummary[]> {
  return apiGet<RunSummary[]>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/runs?take=${take}`,
  );
}

/** Paged runs for a project (GET — legacy `page`/`pageSize` on page 1, or `cursor`+`take` for keyset pages). */
export async function listRunsByProjectPaged(
  projectId: string,
  page: number,
  pageSize: number,
  options?: { readonly cursor?: string | null; readonly includeArchived?: boolean },
): Promise<PagedResponse<RunSummary>> {
  const q = new URLSearchParams();

  if (options?.cursor) {
    q.set("cursor", options.cursor);
    q.set("take", String(pageSize));
  } else {
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));
  }

  if (options?.includeArchived === true) {
    q.set("includeArchived", "true");
  }

  return apiGet<PagedResponse<RunSummary>>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/runs?${q}`,
  );
}

/** Restores a soft-archived architecture request (POST /v1/architecture/request/{requestId}/restore). */
export async function restoreArchitectureRequest(requestId: string): Promise<void> {
  return apiPostNoContent(`/v1/architecture/request/${encodeURIComponent(requestId)}/restore`, {});
}

/** Fetches the lightweight summary for a single run. */
export async function getRunSummary(runId: string): Promise<RunSummary> {
  return apiGet<RunSummary>(`/v1/authority/runs/${runId}/summary`);
}

/** Fetches the full run detail envelope (run metadata, snapshots, manifest, trace, bundle). */
export async function getRunDetail(runId: string): Promise<ApiResponseWithTrace<RunDetail>> {
  return apiGetJsonWithTrace<RunDetail>(`/v1/authority/runs/${runId}`);
}

/** Structural provenance graph for a completed authority run (422 if snapshots incomplete). */
export async function getRunProvenance(runId: string): Promise<DecisionProvenanceGraph> {
  return apiGet<DecisionProvenanceGraph>(`/v1/authority/runs/${runId}/provenance`);
}

/** Run-scoped audit events oldest-first (pipeline / lifecycle timeline for operators). */
export async function getRunPipelineTimeline(runId: string): Promise<PipelineTimelineItem[]> {
  return apiGet<PipelineTimelineItem[]>(`/v1/authority/runs/${runId}/pipeline-timeline`);
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
    `/v1/architecture/run/${encodeURIComponent(runId)}/traces?${q}`,
  );
}

/** Trace-derived redacted invocation forensics (TB-110). */
export async function getRunToolInvocationForensics(
  runId: string,
): Promise<ApiResponseWithTrace<RunToolInvocationForensicsPayload>> {
  return apiGetJsonWithTrace<RunToolInvocationForensicsPayload>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/tool-invocation-forensics`,
  );
}

/** On-demand structural evaluation of persisted `parsedResultJson` per trace (no OTel side effects in API). */
export async function getRunAgentEvaluation(
  runId: string,
): Promise<ApiResponseWithTrace<AgentOutputEvaluationSummaryPayload>> {
  return apiGetJsonWithTrace<AgentOutputEvaluationSummaryPayload>(
    `/v1/architecture/run/${encodeURIComponent(runId)}/agent-evaluation`,
  );
}

/** Redaction-safe retrieval grounding diagnostics for one authority run. */
export async function getRunRetrievalGrounding(
  runId: string,
): Promise<ApiResponseWithTrace<RunRetrievalGroundingPayload>> {
  return apiGetJsonWithTrace<RunRetrievalGroundingPayload>(
    `/v1/authority/runs/${encodeURIComponent(runId)}/retrieval-grounding`,
  );
}

/** Fetches golden manifest summary (decision count, warnings, status, etc.). */
export async function getManifestSummary(manifestId: string): Promise<ManifestSummary> {
  return apiGet<ManifestSummary>(`/v1/authority/manifests/${manifestId}/summary`);
}

/** Lists all synthesized artifacts for a manifest (metadata only, no binary content). */
export async function listArtifacts(manifestId: string): Promise<ArtifactDescriptor[]> {
  return apiGet<ArtifactDescriptor[]>(`/v1/artifacts/manifests/${manifestId}`);
}

/** JSON metadata for one artifact (no binary download). */
export async function getArtifactDescriptor(
  manifestId: string,
  artifactId: string,
): Promise<ArtifactDescriptor> {
  return apiGet<ArtifactDescriptor>(
    `/v1/artifacts/manifests/${manifestId}/artifact/${artifactId}/descriptor`,
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
  const path = `/v1/artifacts/manifests/${encodeURIComponent(manifestId)}/artifact/${encodeURIComponent(artifactId)}`;
  const { url, headers } = resolveBinaryGetRequest(path);
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

/** Legacy flat-diff comparison between two runs (run-level + optional manifest diffs). */
export async function compareRuns(leftRunId: string, rightRunId: string): Promise<RunComparison> {
  return apiGet<RunComparison>(
    `/v1/authority/compare/runs?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
}

/** Structured golden manifest comparison (decision/requirement/security/topology/cost deltas). */
export async function compareGoldenManifestRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<GoldenManifestComparison> {
  return apiGet<GoldenManifestComparison>(
    `/v1/compare?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Latest authority manifest document JSON for a run (`GET /v1/authority/runs/{runId}/manifest`). */
export async function getAuthorityRunManifest(runId: string): Promise<unknown> {
  return apiGet<unknown>(`/v1/authority/runs/${encodeURIComponent(runId)}/manifest`);
}

/** Requests an AI-generated narrative explanation of the differences between two runs. */
export async function explainComparisonRuns(
  baseRunId: string,
  targetRunId: string,
): Promise<ComparisonExplanation> {
  return apiGet<ComparisonExplanation>(
    `/v1/explain/compare/explain?baseRunId=${encodeURIComponent(baseRunId)}&targetRunId=${encodeURIComponent(targetRunId)}`,
  );
}

/** Requests an AI-generated explanation of a single run's decisions and implications. */
export async function explainRun(runId: string): Promise<RunExplanation> {
  return apiGet<RunExplanation>(`/v1/explain/runs/${encodeURIComponent(runId)}/explain`);
}

/** Aggregate executive explanation (themes, posture, counts) with nested full explanation payload. */
export async function getRunExplanationSummary(runId: string): Promise<RunExplanationSummary> {
  return apiGet<RunExplanationSummary>(`/v1/explain/runs/${encodeURIComponent(runId)}/aggregate`);
}

/**
 * Fetches the sponsor first-value report (Markdown body) for a run.
 * Returns `null` when the API responds 404 (run not found / not committed yet).
 */
export async function getFirstValueReportMarkdown(runId: string): Promise<string | null> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(`/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`);
  const h = withCorrelationHeaders(headers);
  h.set("Accept", "text/markdown");
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) throwApiRequestError(response, text);

  return text;
}
