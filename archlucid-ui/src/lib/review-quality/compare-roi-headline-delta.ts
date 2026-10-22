import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { formatUsd } from "@/lib/roi-assumptions";
import type { RunSavingsSummaryModel } from "@/lib/runs/run-savings-summary-model";

export type CompareRoiHeadlineSide = {
  readonly label: string;
  readonly savingsLabel: string | null;
  readonly basisFootnote: string | null;
};

export type CompareRoiHeadlineDeltaView = {
  readonly baseline: CompareRoiHeadlineSide;
  readonly target: CompareRoiHeadlineSide;
  readonly nonSummingLine: string;
};

function formatCompareRoiSide(
  label: string,
  savings: RunSavingsSummaryModel | null,
): CompareRoiHeadlineSide {
  if (savings === null || !Number.isFinite(savings.annualizedUsd) || savings.annualizedUsd <= 0) {
    return {
      label,
      savingsLabel: null,
      basisFootnote: null,
    };
  }

  return {
    label,
    savingsLabel: formatUsd(savings.annualizedUsd),
    basisFootnote: savings.basisFootnotes[0]?.trim() ?? null,
  };
}

/** Compare-two-reviews run-level estimated USD — disposition-aware per run, not a portfolio rollup delta. */
export function buildCompareRoiHeadlineDeltaView(input: {
  readonly baselineSavings: RunSavingsSummaryModel | null;
  readonly targetSavings: RunSavingsSummaryModel | null;
}): CompareRoiHeadlineDeltaView | null {
  const baselineUsd = input.baselineSavings?.annualizedUsd ?? 0;
  const targetUsd = input.targetSavings?.annualizedUsd ?? 0;

  if ((!Number.isFinite(baselineUsd) || baselineUsd <= 0) && (!Number.isFinite(targetUsd) || targetUsd <= 0)) {
    return null;
  }

  return {
    baseline: formatCompareRoiSide("Baseline review", input.baselineSavings),
    target: formatCompareRoiSide("Updated review", input.targetSavings),
    nonSummingLine: SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE,
  };
}
