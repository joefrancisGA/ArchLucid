import type { components } from "@/lib/openapi-schemas";

/** `GET /v1/explain/runs/{runId}/explain` — legacy alias for OpenAPI `ExplanationResult`. */
export type RunExplanation = components["schemas"]["ExplanationResult"];

/** Provenance for a run explanation (agent, model, optional prompt catalog fields). */
export type ExplanationProvenance = components["schemas"]["ExplanationProvenance"];

/** Structured LLM envelope nested under `ExplanationResult` on the API. */
export type StructuredExplanation = components["schemas"]["StructuredExplanation"];

/** OpenAPI coarse evaluation-backed confidence bucket (`FindingConfidenceLevel` string enum). */
export type FindingConfidenceLevel = NonNullable<components["schemas"]["FindingConfidenceLevel"]>;

/** OpenAPI wire enum for the same coarse buckets (string JSON; legacy numeric wire still normalized at runtime). */
export type FindingConfidenceLevelWire = components["schemas"]["FindingConfidenceLevel"];

/** Normalizes numeric or string API confidence to operator-facing labels. */
export function normalizeFindingConfidenceLevel(
  level: FindingConfidenceLevelWire | FindingConfidenceLevel | number | string | null | undefined,
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
export type FindingExplainabilityEvidence = components["schemas"]["FindingExplainabilityEvidence"];

/** Pointers linking one finding to persisted run artifacts (`GET /v1/architecture/review/.../findings/.../evidence-chain`). */
export type FindingEvidenceChain = components["schemas"]["FindingEvidenceChainResponse"];

/** Redacted LLM audit slice for one finding (`GET /v1/explain/runs/.../findings/.../llm-audit`). */
export type FindingLlmAudit = components["schemas"]["FindingLlmAuditResult"];

/** Deterministic explainability payload for one finding (`GET /v1/explain/runs/.../findings/.../explainability`). */
export type FindingExplainability = components["schemas"]["FindingExplainabilityResult"];

/** AI-generated narrative explaining the differences between two runs. */
export type ComparisonExplanation = components["schemas"]["ComparisonExplanationResult"];
