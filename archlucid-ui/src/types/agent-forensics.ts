/** Row from `GET /v1/architecture/run/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = {
  traceId: string;
  runId: string;
  taskId: string;
  agentType: number;
  parseSucceeded: boolean;
  blobUploadFailed?: boolean | null;
  createdUtc: string;
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
  agentType: number;
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
  agentType: number;
  structuralCompletenessRatio: number;
  isJsonParseFailure: boolean;
  missingKeys: string[];
  semantic?: AgentOutputSemanticScoreRow | null;
  blobUploadFailed?: boolean | null;
  qualityWarning?: boolean;
};

/** Summary from `GET /v1/architecture/run/{runId}/agent-evaluation`. */
import type { components } from "@/lib/openapi-schemas";

/** Row from `GET /v1/architecture/run/{runId}/tool-invocation-forensics` (TB-110). */
export type RunToolInvocationForensicRow = components["schemas"]["RunToolInvocationForensicRow"];

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];

export type AgentOutputEvaluationSummaryPayload = {
  runId: string;
  evaluatedAtUtc: string;
  scores: AgentOutputEvaluationScoreRow[];
  tracesSkippedCount: number;
  averageStructuralCompletenessRatio: number | null;
  /** Mean of {@link AgentOutputSemanticScoreRow.overallSemanticScore} over evaluated rows (same heuristic / optional-judge meaning). */
  averageSemanticScore: number | null;
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
