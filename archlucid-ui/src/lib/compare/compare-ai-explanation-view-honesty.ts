export const COMPARE_AI_EXPLANATION_SUMMARY_NOT_STORED =
  "High-level summary was not returned for this explanation." as const;

export const COMPARE_AI_EXPLANATION_NARRATIVE_NOT_STORED =
  "Narrative was not returned for this explanation." as const;

export const COMPARE_AI_EXPLANATION_TRADEOFFS_NOT_STORED =
  "Key tradeoffs were not returned on this explanation." as const;

export const COMPARE_AI_EXPLANATION_MAJOR_CHANGES_NOT_STORED =
  "No major change lines were stored on this comparison." as const;

export function hasStoredAiComparisonExplanationText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
