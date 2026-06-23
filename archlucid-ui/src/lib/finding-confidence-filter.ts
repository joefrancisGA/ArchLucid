import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/** Minimum evaluation score (0–100 scale) before a finding is shown by default. */
export const LOW_CONFIDENCE_EVALUATION_SCORE_THRESHOLD = 40;

/** Minimum evaluation score (0–1 fraction scale) before a finding is shown by default. */
export const LOW_CONFIDENCE_EVALUATION_FRACTION_THRESHOLD = 0.4;

export type QuickDecisionConfidencePartition = {
  readonly trustedFindings: readonly QuickDecisionFinding[];
  readonly lowConfidenceFindings: readonly QuickDecisionFinding[];
};

function normalizedEvaluationScore(score: number): number {
  if (score <= 1) {
    return score * 100;
  }

  return score;
}

/** True when the finding should be hidden from default quick-decision views. */
export function isLowConfidenceFinding(finding: QuickDecisionFinding): boolean {
  if (finding.confidenceLevel === "Low") {
    return true;
  }

  const score = finding.evaluationConfidenceScore;

  if (score === null || score === undefined || !Number.isFinite(score)) {
    return false;
  }

  if (score <= 1) {
    return score < LOW_CONFIDENCE_EVALUATION_FRACTION_THRESHOLD;
  }

  return score < LOW_CONFIDENCE_EVALUATION_SCORE_THRESHOLD;
}

export function partitionQuickDecisionFindingsByConfidence(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionConfidencePartition {
  const trustedFindings: QuickDecisionFinding[] = [];
  const lowConfidenceFindings: QuickDecisionFinding[] = [];

  for (const finding of findings) {
    if (isLowConfidenceFinding(finding)) {
      lowConfidenceFindings.push(finding);
    } else {
      trustedFindings.push(finding);
    }
  }

  return { trustedFindings, lowConfidenceFindings };
}

export function formatHiddenLowConfidenceHint(hiddenCount: number): string | null {
  if (hiddenCount <= 0) {
    return null;
  }

  return `${hiddenCount} low-confidence finding${hiddenCount === 1 ? "" : "s"} hidden`;
}

export function evaluationScoreDisplay(score: number | null | undefined): string | null {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return null;
  }

  const normalized = normalizedEvaluationScore(score);

  return `${Math.round(normalized)}`;
}
