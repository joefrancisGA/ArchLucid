import type { FindingConfidenceLevel } from "@/types/explanation-confidence";

/** Structured LLM envelope nested under `ExplanationResult` on the API. */
export type StructuredExplanation = {
  schemaVersion: number;
  reasoning: string;
  evidenceRefs: string[];
  confidence: number | null;
  alternativesConsidered?: string[] | null;
  caveats?: string[] | null;
};

/** Deterministic factual explainability for one finding (never LLM-derived). */
export type FindingExplainabilityEvidence = {
  evidenceRefs: string[];
  conclusion: string;
  alternativePathsConsidered: string[];
  ruleId: string;
};

/** Pointers linking one finding to persisted run artifacts (`GET /v1/architecture/review/.../findings/.../evidence-chain`). */
export type FindingEvidenceChain = {
  runId: string;
  findingId: string;
  manifestVersion?: string | null;
  findingsSnapshotId?: string | null;
  contextSnapshotId?: string | null;
  graphSnapshotId?: string | null;
  decisionTraceId?: string | null;
  goldenManifestId?: string | null;
  relatedGraphNodeIds: string[];
  agentExecutionTraceIds: string[];
};

/** Redacted LLM audit slice for one finding (`GET /v1/explain/runs/.../findings/.../llm-audit`). */
export type FindingLlmAudit = {
  traceId: string;
  agentType: string;
  systemPromptRedacted: string;
  userPromptRedacted: string;
  rawResponseRedacted: string;
  modelDeploymentName?: string | null;
  modelVersion?: string | null;
  redactionCountsByCategory: Record<string, number>;
};

/** Deterministic explainability payload for one finding (`GET /v1/explain/runs/.../findings/.../explainability`). */
export type FindingExplainability = {
  findingId: string;
  title: string;
  engineType: string;
  severity: string;
  traceCompletenessRatio: number;
  /** Trace dimensions that were empty when completeness was scored. */
  missingTraceFields?: string[] | null;
  graphNodeIdsExamined: string[];
  rulesApplied: string[];
  decisionsTaken: string[];
  alternativePathsConsidered: string[];
  notes: string[];
  /** Structured factual explainability; absent on older API responses. */
  evidence?: FindingExplainabilityEvidence | null;
  narrativeText: string;
  /** Evaluation-derived confidence when persisted (absent on older responses). */
  evaluationConfidenceScore?: number | null;
  confidenceLevel?: FindingConfidenceLevel | null;
};
