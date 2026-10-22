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

/** OpenAPI-backed explanation DTOs used by aggregate explain surfaces (#20). */
export type ExplanationResult = components["schemas"]["ExplanationResult"];
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

/** AI-generated narrative explaining the differences between two runs. */
export type ComparisonExplanation = {
  highLevelSummary: string;
  majorChanges: string[];
  keyTradeoffs: string[];
  narrative: string;
};
