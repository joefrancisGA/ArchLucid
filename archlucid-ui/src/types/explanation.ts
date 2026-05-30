import type { components } from "@/lib/api-types.generated";

/** AI-generated explanation of a single run's decisions, risks, costs, and compliance. */
export type RunExplanation = {
  summary: string;
  keyDrivers: string[];
  riskImplications: string[];
  costImplications: string[];
  complianceImplications: string[];
  detailedNarrative: string;
};

/** Provenance for a run explanation (agent, model, optional prompt catalog fields). */
export type ExplanationProvenance = {
  agentType: string;
  modelId: string;
  promptTemplateId: string | null;
  promptTemplateVersion: string | null;
  promptContentHash: string | null;
};

/** Structured LLM envelope nested under `ExplanationResult` on the API. */
export type StructuredExplanation = {
  schemaVersion: number;
  reasoning: string;
  evidenceRefs: string[];
  confidence: number | null;
  alternativesConsidered?: string[] | null;
  caveats?: string[] | null;
};

/** API string enum for coarse evaluation-backed confidence (JSON via JsonStringEnumConverter). */
export type FindingConfidenceLevel = "High" | "Medium" | "Low";

/** OpenAPI wire enum (numeric JSON) for the same coarse buckets. */
export type FindingConfidenceLevelWire = components["schemas"]["FindingConfidenceLevel"];

/** Normalizes numeric or string API confidence to operator-facing labels. */
export function normalizeFindingConfidenceLevel(
  level: FindingConfidenceLevelWire | FindingConfidenceLevel | string | null | undefined,
): FindingConfidenceLevel | null {
  if (level === "High" || level === 0) {
    return "High";
  }

  if (level === "Medium" || level === 1) {
    return "Medium";
  }

  if (level === "Low" || level === 2) {
    return "Low";
  }

  if (typeof level === "string") {
    const trimmed = level.trim();
    const normalized =
      trimmed.length > 0
        ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
        : trimmed;

    if (normalized === "High" || normalized === "Medium" || normalized === "Low") {
      return normalized;
    }
  }

  return null;
}

/** Parses API ratio fields that may arrive as JSON numbers or decimal strings. */
export function normalizeFiniteRatio(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/** Converts API trace completeness ratio (0–1 or 0–100) to a whole-number percent label. */
export function traceCompletenessPercent(ratio: number | string | null | undefined): number | null {
  const normalized = normalizeFiniteRatio(ratio);

  if (normalized === null) {
    return null;
  }

  return normalized <= 1 ? Math.round(normalized * 100) : Math.round(normalized);
}

/** OpenAPI-backed explanation DTOs used by aggregate explain surfaces (#20). */
export type ExplanationResult = components["schemas"]["ExplanationResult"];
export type FindingTraceConfidenceDto = components["schemas"]["FindingTraceConfidenceDto"];
export type CitationReference = components["schemas"]["CitationReference"];
export type RunExplanationSummary = components["schemas"]["RunExplanationSummary"];

/** True when explanation used deterministic fallback (supports legacy wire flag). */
export function isDeterministicExplanationFallback(
  summary: RunExplanationSummary | null | undefined,
): boolean {
  if (summary?.deterministicFallbackUsed === true) {
    return true;
  }

  const legacy = summary as (RunExplanationSummary & { usedDeterministicFallback?: boolean }) | null | undefined;

  return legacy?.usedDeterministicFallback === true;
}

/** Deterministic factual explainability for one finding (never LLM-derived). */
export type FindingExplainabilityEvidence = {
  evidenceRefs: string[];
  conclusion: string;
  alternativePathsConsidered: string[];
  ruleId: string;
};

/** Pointers linking one finding to persisted run artifacts (`GET /v1/architecture/run/.../findings/.../evidence-chain`). */
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

/** AI-generated narrative explaining the differences between two runs. */
export type ComparisonExplanation = {
  highLevelSummary: string;
  majorChanges: string[];
  keyTradeoffs: string[];
  narrative: string;
};
