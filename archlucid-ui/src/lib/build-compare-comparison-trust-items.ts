import { COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER } from "@/lib/compare-effective-governance-diff";
import type { CompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import type { FindingSeverityKind } from "@/lib/design-tokens";

export type CompareComparisonTrustItem = {
  readonly id: string;
  readonly severity: FindingSeverityKind;
  readonly headline: string;
  readonly detail: string;
};

const SEVERITY_RANK: Record<FindingSeverityKind, number> = {
  critical: 0,
  error: 1,
  high: 2,
  warning: 3,
  medium: 4,
  low: 5,
  info: 6,
  unknown: 7,
};

export function buildCompareComparisonTrustItems(input: {
  readonly executionModeHonesty: CompareExecutionModeHonesty | null;
  readonly usesCurrentEffectiveOnly: boolean;
  readonly hasAiNarrative: boolean;
}): readonly CompareComparisonTrustItem[] {
  const items: CompareComparisonTrustItem[] = [];

  if (input.executionModeHonesty !== null && input.executionModeHonesty.advisoryParagraph !== null) {
    const severity: FindingSeverityKind =
      input.executionModeHonesty.modesDiffer ? "high" : "medium";
    const headline = input.executionModeHonesty.modesDiffer
      ? "Execution modes differ between reviews"
      : input.executionModeHonesty.modeUnavailable
        ? "Execution mode metadata unavailable"
        : "Non-real execution on one or both reviews";

    items.push({
      id: "execution-mode",
      severity,
      headline,
      detail: input.executionModeHonesty.advisoryParagraph,
    });
  }

  if (input.usesCurrentEffectiveOnly) {
    items.push({
      id: "governance-current-effective",
      severity: "medium",
      headline: "Governance diff uses current effective policy only",
      detail: COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER,
    });
  }

  if (input.hasAiNarrative) {
    items.push({
      id: "ai-advisory",
      severity: "low",
      headline: "AI narrative is advisory",
      detail:
        "Summaries and AI-generated narratives summarize posture shifts. Per-finding trust labels on inspect, sealed review record, and export paths remain authoritative for provenance.",
    });
  }

  return items.sort((left, right) => SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]);
}
