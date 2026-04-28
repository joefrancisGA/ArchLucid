import type { ComparisonExplanation } from "@/types/explanation";

/** AI compare explanation that passes `coerceComparisonExplanation`. */
export function fixtureComparisonExplanation(): ComparisonExplanation {
  return {
    highLevelSummary: "Target run adds intake capacity versus the baseline run.",
    majorChanges: ["Fourth service introduced in target topology.", "Estimated cost rises modestly."],
    keyTradeoffs: ["Higher cost vs. improved isolation."],
    narrative:
      "Structured comparison narrative for reviewer sign-off — deterministic offline copy without a live model call.",
  };
}
