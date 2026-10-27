import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { formatUsd } from "@/lib/roi-assumptions";
import type { RunSavingsSummaryModel } from "@/lib/runs/run-savings-summary-model";

export const COMPARE_ROI_SAVINGS_NOT_RETURNED_LABEL = "Annualized savings were not returned." as const;
export const COMPARE_ROI_NO_ESTIMATED_SAVINGS_LABEL = "No estimated savings on this run" as const;

export type CompareRoiHeadlineSide = {
  readonly label: string;
  readonly savingsLabel: string;
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
  if (savings === null) {
    return {
      label,
      savingsLabel: COMPARE_ROI_SAVINGS_NOT_RETURNED_LABEL,
      basisFootnote: null,
    };
  }

  if (!Number.isFinite(savings.annualizedUsd) || savings.annualizedUsd <= 0) {
    return {
      label,
      savingsLabel: COMPARE_ROI_NO_ESTIMATED_SAVINGS_LABEL,
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
  if (input.baselineSavings === null && input.targetSavings === null) {
    return null;
  }

  const baselineUsd = input.baselineSavings?.annualizedUsd;
  const targetUsd = input.targetSavings?.annualizedUsd;
  const baselinePositive = baselineUsd != null && Number.isFinite(baselineUsd) && baselineUsd > 0;
  const targetPositive = targetUsd != null && Number.isFinite(targetUsd) && targetUsd > 0;

  if (!baselinePositive && !targetPositive && input.baselineSavings !== null && input.targetSavings !== null) {
    return null;
  }

  return {
    baseline: formatCompareRoiSide("Baseline review", input.baselineSavings),
    target: formatCompareRoiSide("Updated review", input.targetSavings),
    nonSummingLine: SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE,
  };
}
