import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
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

/** Policy violations that are not dispositioned still block governance approval. */
export function isApprovalBlockingFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted) {
    return false;
  }

  if (finding.enforcementTier === "Advisory") {
    return false;
  }

  if (isReviewFindingDispositionClosed(finding)) {
    return false;
  }

  return finding.enforcementTier === "PolicyViolation";
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
    if (isLowConfidenceFinding(finding) && !isApprovalBlockingFinding(finding)) {
      lowConfidenceFindings.push(finding);
    } else {
      trustedFindings.push(finding);
    }
  }

  return { trustedFindings, lowConfidenceFindings };
}

export type FindingsConfidenceVisibilityResult = {
  readonly visibleFindings: readonly QuickDecisionFinding[];
  readonly hiddenByConfidenceCount: number;
};

/** Applies the confidence gate while always retaining approval-blocking findings. */
export function applyFindingsConfidenceVisibility(
  findings: readonly QuickDecisionFinding[],
  showLowConfidence: boolean,
): FindingsConfidenceVisibilityResult {
  if (showLowConfidence) {
    return { visibleFindings: findings, hiddenByConfidenceCount: 0 };
  }

  const visibleFindings: QuickDecisionFinding[] = [];
  let hiddenByConfidenceCount = 0;

  for (const finding of findings) {
    if (isLowConfidenceFinding(finding) && !isApprovalBlockingFinding(finding)) {
      hiddenByConfidenceCount += 1;
    } else {
      visibleFindings.push(finding);
    }
  }

  return { visibleFindings, hiddenByConfidenceCount };
}

export function formatFindingsVisibilitySummaryLine(
  shownCount: number,
  toolbarFilteredCount: number,
  hiddenByConfidenceCount: number,
): string | null {
  if (hiddenByConfidenceCount <= 0 && shownCount === toolbarFilteredCount) {
    return null;
  }

  if (hiddenByConfidenceCount > 0) {
    return `Showing ${shownCount} of ${toolbarFilteredCount} — ${hiddenByConfidenceCount} hidden by confidence filter`;
  }

  return `Showing ${shownCount} of ${toolbarFilteredCount}`;
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
