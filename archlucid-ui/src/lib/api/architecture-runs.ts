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
} from "@/types/agent-forensics";
import type { StageTimelineSummary } from "@/types/stage-timeline";

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];
import {
  clearWizardSubmissionSession,
  getOrCreateWizardIdempotencyKey,
  getOrCreateWizardRequestId,
  rotateWizardSubmissionSession,
} from "@/lib/wizard-idempotency-key";
import {
  ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE,
  isArchitectureRequestCreateGatewayTimeout,
} from "@/lib/api/architecture-request-create-guard";
import { ApiRequestError, isApiRequestError } from "@/lib/api-request-error";
import { trackInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
} from "@/lib/operations/review-pipeline-in-flight";
import {
  type ApiResponseWithTrace,
  apiGet,
  apiGetJsonWithTrace,
  apiPatchJson,
  apiPostAcceptedWithLocation,
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
  cloudProvider: "None" | "Azure" | "Aws" | "Gcp";
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
  requestSource?: "wizard" | "cli";
  wizardPresetUsed?: string;
  modelExecutionProfileOverride?: "Economy" | "Balanced" | "HighAssurance";
  modelAliasOverride?: string;
  intakeQuestionAnswers?: Record<string, string>;
  intakeTransparencyTrail?: {
    asserted: readonly { key: string; value: string }[];
    inferred: readonly { key: string; value: string; confidence: number }[];
    skipped: readonly { questionKey: string; tier: "Must" | "Should" }[];
  };
};

/** Response envelope for POST /v1/architecture/request. */
export type CreateArchitectureRunResponsePayload =
  components["schemas"]["CreateArchitectureRunResponse"];

function isWizardManagedCreateRun(options?: { readonly idempotencyKey?: string }): boolean {
  return (options?.idempotencyKey?.trim() ?? "").length === 0;
}

function resolveWizardCreateRunPayload(
  body: CreateArchitectureRunRequestPayload,
): CreateArchitectureRunRequestPayload {
  return {
    ...body,
    requestId: getOrCreateWizardRequestId(),
  };
}

function isCreateRunIdempotencyBodyConflict(error: unknown): boolean {
  if (!isApiRequestError(error) || error.httpStatus !== 409) {
    return false;
  }

  const detail = (error.problem?.detail ?? error.message).toLowerCase();

  return detail.includes("idempotency-key") && detail.includes("different request");
}

async function postCreateArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  idempotencyKey: string,
): Promise<CreateArchitectureRunResponsePayload> {
  return apiPostJson<CreateArchitectureRunResponsePayload>("/v1/architecture/request", body, {
    extraHeaders: { "Idempotency-Key": idempotencyKey },
  });
}

function rethrowCreateRunGatewayTimeout(error: ApiRequestError): never {
  const upstreamDetail = error.problem?.detail?.trim() ?? "";
  const message =
    upstreamDetail.length > 0
      ? `${ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE} Details: ${upstreamDetail}`
      : ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE;

  throw new ApiRequestError(message, {
    problem: error.problem,
    correlationId: error.correlationId,
    httpStatus: error.httpStatus,
    retryAfterSeconds: error.retryAfterSeconds,
  });
}

/** Submits a new architecture run (POST /v1/architecture/request). */
export async function createArchitectureRun(
  body: CreateArchitectureRunRequestPayload,
  options?: { readonly idempotencyKey?: string },
): Promise<CreateArchitectureRunResponsePayload> {
  const wizardManaged = isWizardManagedCreateRun(options);
  let idempotencyKey = options?.idempotencyKey?.trim() || getOrCreateWizardIdempotencyKey();
  let payload = wizardManaged ? resolveWizardCreateRunPayload(body) : body;
  let retriedAfterIdempotencyConflict = false;

  while (true) {
    try {
      const response = await postCreateArchitectureRun(payload, idempotencyKey);

      if (wizardManaged) {
        clearWizardSubmissionSession();
      }

      return response;
    } catch (error: unknown) {
      if (
        wizardManaged &&
        !retriedAfterIdempotencyConflict &&
        isCreateRunIdempotencyBodyConflict(error)
      ) {
        rotateWizardSubmissionSession();
        idempotencyKey = getOrCreateWizardIdempotencyKey();
        payload = resolveWizardCreateRunPayload(body);
        retriedAfterIdempotencyConflict = true;

        continue;
      }

      if (
        isApiRequestError(error) &&
        isArchitectureRequestCreateGatewayTimeout(error.httpStatus, error.problem)
      ) {
        rethrowCreateRunGatewayTimeout(error);
      }

      throw error;
    }
  }
}

/** Pins or unpins a run (PATCH /v1/architecture/review/{runId}/pin). Omit `isPinned` to toggle. */
export async function pinArchitectureRun(
  runId: string,
  body: { readonly isPinned?: boolean } = {},
): Promise<{ runId: string; isPinned: boolean }> {
  return apiPatchJson<{ runId: string; isPinned: boolean }>(
    `/v1/architecture/review/${encodeURIComponent(runId)}/pin`,
    body,
  );
}

/** Finalizes agent results into a Finalized review record (POST /v1/architecture/review/{runId}/finalize). */
export async function commitArchitectureRun(
  runId: string,
  options?: {
    readonly notifySponsor?: boolean;
    readonly acknowledgedAssumptionIds?: readonly string[];
  },
): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/finalize`, {
    notifySponsor: options?.notifySponsor === true,
    acknowledgedAssumptionIds: options?.acknowledgedAssumptionIds ?? undefined,
  });
}

/** Runs agent pipeline for an architecture review (POST /v1/architecture/review/{runId}/execute). */
export async function executeArchitectureRun(runId: string): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/execute`, {});
}

export type ExecuteArchitectureRunAsyncResult = {
  readonly operationId: string;
  readonly location: string | null;
};

/**
 * Tier C async execute (TB-2075): 202 + Location, then register shell in-flight (TB-2077).
 * Prefer this for Real-mode work behind proxy/edge timeouts; keep sync {@link executeArchitectureRun} for Simulator/CI.
 */
export async function executeArchitectureRunAsync(
  runId: string,
): Promise<ExecuteArchitectureRunAsyncResult> {
  const accepted = await apiPostAcceptedWithLocation(
    `/v1/architecture/review/${encodeURIComponent(runId)}/execute/async`,
    {},
  );
  const operationId =
    parseOperationIdFromLocation(accepted.location) ?? reviewPipelineOperationId(runId);

  trackInFlightOperation({
    operationId,
    title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
    href: reviewPipelineDetailHref(runId),
    runId,
    stepLabel: "Queued",
    state: "Pending",
  });

  return { operationId, location: accepted.location };
}

/** TB-938: re-execute selected agents only (POST /v1/architecture/review/{runId}/execute/selective). */
export async function executeArchitectureRunSelective(
  runId: string,
  body: {
    readonly agentTypes?: readonly string[];
    readonly taskIds?: readonly string[];
    readonly includeDependents?: boolean;
  },
): Promise<unknown> {
  return apiPostJson<unknown>(`/v1/architecture/review/${encodeURIComponent(runId)}/execute/selective`, {
    agentTypes: body.agentTypes ?? [],
    taskIds: body.taskIds ?? [],
    includeDependents: body.includeDependents !== false,
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

/** Restores a soft-archived architecture request (POST /v1/architecture/request/{requestId}/restore). */
export async function restoreArchitectureRequest(requestId: string): Promise<void> {
  return apiPostNoContent(`/v1/architecture/request/${encodeURIComponent(requestId)}/restore`, {});
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
  return apiGet<RunSummary>(`/v1/authority/reviews/${runId}/summary`, options);
}

/** Fetches the full run detail envelope (run metadata, snapshots, manifest, trace, bundle). */
export async function getRunDetail(
  runId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ApiResponseWithTrace<RunDetail>> {
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
  options?: { readonly scopeHeaders?: Record<string, string> },
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

type EndToEndReplayComparisonWireResponse = {
  readonly report?: {
    readonly findingCorrelation?: unknown;
    readonly findingLifecycle?: unknown;
    readonly findingLifecycleRecords?: unknown;
    readonly compareQualityDelta?: unknown;
  } | null;
};

/** Full end-to-end replay comparison report (includes finding correlation metadata for export parity). */
export async function compareRunsEndToEnd(
  leftRunId: string,
  rightRunId: string,
): Promise<EndToEndReplayComparisonWireResponse> {
  return apiGet<EndToEndReplayComparisonWireResponse>(
    `/v1/architecture/review/compare/end-to-end?leftRunId=${encodeURIComponent(leftRunId)}&rightRunId=${encodeURIComponent(rightRunId)}`,
  );
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

/** Latest authority manifest document JSON for a run (`GET /v1/authority/reviews/{runId}/signed-review-record`). */
export async function getAuthorityRunManifest(runId: string): Promise<unknown> {
  return apiGet<unknown>(`/v1/authority/reviews/${encodeURIComponent(runId)}/signed-review-record`);
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

/**
 * Fetches the sponsor first-value report (Markdown body) for a run.
 * Returns `null` when the API responds 404 (run not found / not committed yet).
 */
export async function getFirstValueReportMarkdown(runId: string): Promise<string | null> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(`/v1/pilots/runs/${encodeURIComponent(runId)}/first-value-report`);
  const h = withCorrelationHeaders(headers);
  h.set("Accept", "text/markdown");
  const response = await fetch(url, { cache: "no-store", headers: h });
  const text = await response.text();

  if (response.status === 404) return null;

  if (!response.ok) throwApiRequestError(response, text);

  return text;
}
