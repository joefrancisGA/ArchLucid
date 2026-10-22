import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";

export type FindingsHiddenFilterHonestyInput = {
  readonly toolbarFilteredCount: number;
  readonly visibleCount: number;
  readonly hiddenFindings: readonly QuickDecisionFinding[];
};

export type FindingsHiddenFilterHonesty = {
  readonly hiddenCount: number;
  readonly hiddenDecisionGradeCount: number;
  readonly line: string | null;
  readonly hasHidden: boolean;
};

function pluralizeFindings(count: number): string {
  return `${count} finding${count === 1 ? "" : "s"}`;
}

function formatHiddenFindingsLine(hiddenCount: number): string {
  return `${pluralizeFindings(hiddenCount)} hidden by filters`;
}

/**
 * Desk honesty for power-user filters (DA-08). Counts rows hidden from the visible band
 * that keyboard shortcuts traverse — not hover-only tooltips.
 */
export function deriveFindingsHiddenFilterHonesty(
  input: FindingsHiddenFilterHonestyInput,
): FindingsHiddenFilterHonesty {
  const hiddenCount = Math.max(0, input.toolbarFilteredCount - input.visibleCount);

  if (hiddenCount <= 0) {
    return {
      hiddenCount: 0,
      hiddenDecisionGradeCount: 0,
      line: null,
      hasHidden: false,
    };
  }

  let hiddenDecisionGradeCount = 0;

  for (const finding of input.hiddenFindings) {
    if (isDecisionGradeFinding(finding)) {
      hiddenDecisionGradeCount += 1;
    }
  }

  if (hiddenDecisionGradeCount > 0) {
    const decisionPhrase =
      hiddenDecisionGradeCount === 1 ? "decision-grade row is" : "decision-grade rows are";

    return {
      hiddenCount,
      hiddenDecisionGradeCount,
      line: `${formatHiddenFindingsLine(hiddenCount)} — ${hiddenDecisionGradeCount} ${decisionPhrase} hidden`,
      hasHidden: true,
    };
  }

  return {
    hiddenCount,
    hiddenDecisionGradeCount: 0,
    line: formatHiddenFindingsLine(hiddenCount),
    hasHidden: true,
  };
}

export const FINDINGS_HIDDEN_FILTER_SHOW_ALL_LABEL = "Show all";
