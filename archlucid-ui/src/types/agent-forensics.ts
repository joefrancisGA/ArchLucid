/** Row from `GET /v1/architecture/run/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = {
  traceId: string;
  runId: string;
  taskId: string;
  agentType: number;
  parseSucceeded: boolean;
  blobUploadFailed?: boolean | null;
  createdUtc: string;
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
export type AgentOutputEvaluationSummaryPayload = {
  runId: string;
  evaluatedAtUtc: string;
  scores: AgentOutputEvaluationScoreRow[];
  tracesSkippedCount: number;
  averageStructuralCompletenessRatio: number | null;
  /** Mean of {@link AgentOutputSemanticScoreRow.overallSemanticScore} over evaluated rows (same heuristic / optional-judge meaning). */
  averageSemanticScore: number | null;
};
