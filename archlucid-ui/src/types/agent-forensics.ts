/** Row from `GET /v1/architecture/review/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = {
  traceId: string;
  runId: string;
  taskId: string;
  agentType: string | number;
  parseSucceeded: boolean;
  blobUploadFailed?: boolean | null;
  qualityWarning?: boolean;
  qualityRejected?: boolean;
  createdUtc: string;
  /** Governed customer-facing alias (TB-871); prefer over deployment name in UI. */
  modelAlias?: string | null;
  /** Redacted inline fields; execute-tier UI may preview — full blobs when blob upload succeeded. */
  userPrompt?: string | null;
  rawResponse?: string | null;
  systemPrompt?: string | null;
  parsedResultJson?: string | null;
};

/** Inline prompt/response fields joined to tool-invocation forensics rows (TB-110). */
export type AgentTraceRawSnapshot = {
  userPrompt?: string | null;
  rawResponse?: string | null;
  systemPrompt?: string | null;
  parsedResultJson?: string | null;
};

export type AgentExecutionTraceListPayload = {
  traces: AgentExecutionTraceRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

/** Nested semantic payload under each evaluation row (`AgentOutputSemanticScore`). */
export type AgentOutputSemanticScoreRow = {
  traceId: string;
  agentType: string | number;
  claimsQualityRatio: number;
  findingsQualityRatio: number;
  emptyClaimCount: number;
  incompleteFindingCount: number;
  /**
   * Aggregate shown in UI and recorded as OTel `archlucid_agent_output_semantic_score`: heuristic JSON-structure signal
   * (and optional LLM rubric when enabled) — not embedding similarity or ground-truth correctness.
   */
  overallSemanticScore: number;
  /** Deterministic heuristic aggregate (claims + findings completeness). */
  heuristicOverallScore: number;
  llmJudgeOverallQuality?: number | null;
  llmJudgeNotes?: string | null;
  /**
   * Deterministic claim/finding grounding vs run evidence bundle (0–1); absent when no evidence package or not evaluated.
   * Distinct from {@link agentResultEmbeddingFaithfulnessMeanCosine}.
   */
  agentResultFaithfulnessSupportRatio?: number | null;
  /** Mean embedding cosine vs evidence when `ArchLucid:Agents:Faithfulness:EmbeddingEnabled` is on. */
  agentResultEmbeddingFaithfulnessMeanCosine?: number | null;
};

export type AgentOutputEvaluationScoreRow = {
  traceId: string;
  agentType: string | number;
  structuralCompletenessRatio: number;
  isJsonParseFailure: boolean;
  missingKeys: string[];
  semantic?: AgentOutputSemanticScoreRow | null;
  blobUploadFailed?: boolean | null;
  qualityWarning?: boolean;
  /** Persisted reject reason category from evaluate-time gate (structural | semantic | faithfulness). */
  recordedRejectReasonCategory?: string | null;
};

/** Summary from `GET /v1/architecture/review/{runId}/agent-evaluation`. */
import type { components } from "@/lib/openapi-schemas";

/** Row from `GET /v1/architecture/review/{runId}/tool-invocation-forensics` (TB-110). */
export type RunToolInvocationForensicRow = components["schemas"]["RunToolInvocationForensicRow"];

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];

export type AgentOutputEvaluationPerspectivePayload = {
  authority: "recorded" | "advisoryCurrent";
  gateDefinition?: {
    definitionVersion: string;
    contentHashSha256: string;
    mode: string;
    effectiveFromUtc: string;
    deprecatedReason?: string | null;
  } | null;
  scores: AgentOutputEvaluationScoreRow[];
  tracesSkippedCount: number;
  averageStructuralCompletenessRatio: number | null;
  averageSemanticScore: number | null;
  aggregateQualityGateOutcome?: number | null;
};

export type AgentOutputEvaluationSummaryPayload = {
  runId: string;
  evaluatedAtUtc: string;
  recorded?: AgentOutputEvaluationPerspectivePayload | null;
  advisoryCurrent: AgentOutputEvaluationPerspectivePayload;
};

export type RunRetrievalGroundingScoreSummary = {
  chunkId: string;
  score?: number | null;
};

export type RunRetrievalGroundingRow = {
  traceId: string;
  agentName?: string | null;
  corpusKind?: string | null;
  retrievedChunkIds: string[];
  documentIds: string[];
  scoreSummaries: RunRetrievalGroundingScoreSummary[];
  retrievedChunkCount: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  citationCoverage: number;
  topK?: number | null;
  agentExecutionTraceId?: string | null;
  graphRagNeighborsAdded?: number | null;
  graphRagSeedHits?: number | null;
  graphRagExpansionLatencyMs?: number | null;
  scoreMetadataMalformed: boolean;
  documentMetadataMalformed: boolean;
  createdUtc: string;
};

export type RunRetrievalGroundingPayload = {
  runId: string;
  rows: RunRetrievalGroundingRow[];
  traceCount: number;
  hasDegradedMetadata: boolean;
};
