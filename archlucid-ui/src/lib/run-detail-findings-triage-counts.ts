import { applyFindingsConfidenceVisibility } from "@/lib/finding-confidence-filter";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type RunDetailFindingsTriageCounts = {
  readonly triageVisibleCount: number;
  readonly mutedCount: number;
  readonly hiddenByConfidenceCount: number;
};

/** Default toolbar triage visibility: non-muted rows after the confidence gate. */
export function deriveRunDetailFindingsTriageCounts(
  findings: readonly QuickDecisionFinding[],
): RunDetailFindingsTriageCounts {
  const nonMuted = findings.filter((finding) => !finding.isMuted);
  const mutedCount = findings.length - nonMuted.length;
  const { visibleFindings, hiddenByConfidenceCount } = applyFindingsConfidenceVisibility(
    nonMuted,
    false,
  );

  return {
    triageVisibleCount: visibleFindings.length,
    mutedCount,
    hiddenByConfidenceCount,
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

  if (parts.length === 0) {
    return null;
  }

  return `+${parts.join(" · ")} excluded from triage`;
}
