import type { components } from "@/lib/api-types.generated";

export type PlanningRetrievalCitation = components["schemas"]["PlanningRetrievalCitation"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isOptionalNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

/**
 * OpenAPI currently emits retrievalCitations as unknown[] (malformed items $ref).
 * Narrow before reading signalId / themeKey / snippet.
 */
export function isPlanningRetrievalCitation(value: unknown): value is PlanningRetrievalCitation {
  if (!isRecord(value)) {
    return false;
  }

  if (value.signalId !== undefined && typeof value.signalId !== "string") {
    return false;
  }

  return isOptionalNullableString(value.themeKey) && isOptionalNullableString(value.snippet);
}

export function listPlanningRetrievalCitations(value: unknown): PlanningRetrievalCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPlanningRetrievalCitation);
}

export function planningRetrievalCitationKey(citation: PlanningRetrievalCitation, index: number): string {
  return citation.signalId ?? citation.themeKey ?? citation.snippet ?? `citation-${String(index)}`;
}
