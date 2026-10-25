import {
  countDecisionGradeSemanticSupportBandsForPresentation,
  formatStampSemanticSupportBandLineForPresentation,
  type SemanticSupportBandStampCounts,
} from "@/lib/findings/semantic-support-band-stamp";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type CompareSemanticSupportBandSide = {
  readonly label: string;
  readonly counts: SemanticSupportBandStampCounts;
  readonly summaryLine: string | null;
};

export type CompareSemanticSupportBandDeltaView = {
  readonly baseline: CompareSemanticSupportBandSide;
  readonly target: CompareSemanticSupportBandSide;
};

export const COMPARE_SEMANTIC_SUPPORT_BAND_SUMMARY_NOT_STORED =
  "Semantic support band summary was not stored." as const;

/** Buyer-facing summary line — never imply zero counts when the stamp line is absent. */
export function formatCompareSemanticSupportBandSideSummary(
  side: CompareSemanticSupportBandSide,
): string {
  if (side.summaryLine !== null && side.summaryLine.trim().length > 0) {
    return side.summaryLine;
  }

  if (side.counts.decisionGradeTotal > 0) {
    return COMPARE_SEMANTIC_SUPPORT_BAND_SUMMARY_NOT_STORED;
  }

  return "No decision-grade findings";
}

export function buildCompareSemanticSupportBandDeltaView(input: {
  readonly baselineFindings: readonly QuickDecisionFinding[];
  readonly targetFindings: readonly QuickDecisionFinding[];
  readonly baselineExecutionMode?: StructuralExecutionModeInput;
  readonly targetExecutionMode?: StructuralExecutionModeInput;
}): CompareSemanticSupportBandDeltaView | null {
  const baselineCounts = countDecisionGradeSemanticSupportBandsForPresentation(
    input.baselineFindings,
    input.baselineExecutionMode,
  );
  const targetCounts = countDecisionGradeSemanticSupportBandsForPresentation(
    input.targetFindings,
    input.targetExecutionMode,
  );

  if (baselineCounts.decisionGradeTotal === 0 && targetCounts.decisionGradeTotal === 0) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      counts: baselineCounts,
      summaryLine: formatStampSemanticSupportBandLineForPresentation(
        baselineCounts,
        input.baselineExecutionMode,
      ),
    },
    target: {
      label: "Updated review",
      counts: targetCounts,
      summaryLine: formatStampSemanticSupportBandLineForPresentation(
        targetCounts,
        input.targetExecutionMode,
      ),
    },
  };
}
