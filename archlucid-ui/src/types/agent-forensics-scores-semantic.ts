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
