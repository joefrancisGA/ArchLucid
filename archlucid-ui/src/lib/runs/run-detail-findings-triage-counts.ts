import { applyFindingsConfidenceVisibility } from "@/lib/findings/finding-confidence-filter";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type RunDetailFindingsTriageCounts = {
  readonly triageVisibleCount: number;
  readonly mutedCount: number;
  readonly hiddenByConfidenceCount: number;
  readonly dispositionClosedCount: number;
};

/** Default toolbar triage visibility: open rows after mute, disposition, and confidence gates. */
export function deriveRunDetailFindingsTriageCounts(
  findings: readonly QuickDecisionFinding[],
): RunDetailFindingsTriageCounts {
  const nonMuted = findings.filter((finding) => !finding.isMuted);
  const mutedCount = findings.length - nonMuted.length;
  const triageEligible = nonMuted.filter((finding) => !isReviewFindingDispositionClosed(finding));
  const dispositionClosedCount = nonMuted.length - triageEligible.length;
  const { visibleFindings, hiddenByConfidenceCount } = applyFindingsConfidenceVisibility(
    triageEligible,
    false,
  );

  return {
    triageVisibleCount: visibleFindings.length,
    mutedCount,
    hiddenByConfidenceCount,
    dispositionClosedCount,
  };
}

export function formatFindingsExcludedSummaryLine(counts: RunDetailFindingsTriageCounts): string | null {
  const parts: string[] = [];

  if (counts.mutedCount > 0) {
    parts.push(`${counts.mutedCount} muted`);
  }

  if (counts.hiddenByConfidenceCount > 0) {
    parts.push(`${counts.hiddenByConfidenceCount} low confidence`);
  }

  if (counts.dispositionClosedCount > 0) {
    parts.push(`${counts.dispositionClosedCount} disposition closed`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `+${parts.join(" · ")} excluded from triage`;
}
