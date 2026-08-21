import {
  formatStructuralExecutionModeLabel,
  StructuralExecutionModeWire,
  structuralExecutionModeBadgeTitle,
  EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER,
} from "@/lib/structural-execution-mode";

/** ROI period mix footnote — distinct from within-run Mixed badge copy (TB-971). */
export const EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE =
  "Chart includes both Real and Simulator runs across this reporting period. "
  + "This footnote describes period mix, not whether any single architecture review was Mixed within-run.";

/** Marker phrase in within-run Mixed operator badge copy. */
export { EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER } from "@/lib/structural-execution-mode";

/** Sources scanned by execution-mode-honesty-drift-guard.test.ts (TB-971). */
export const EXECUTION_MODE_HONESTY_DRIFT_GUARD_SOURCES = [
  "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiTrendSection.tsx",
  "src/lib/structural-execution-mode.ts",
  "src/lib/pilot-proof-readiness.ts",
  "src/components/StructuralExecutionModeBadge.tsx",
] as const;

export function resolveSponsorTrendSavingsUsd(
  point: {
    readonly totalEstimatedUsdSavings: number;
    readonly realModeSavingsUsd: number;
    readonly realRunCount: number;
    readonly simulatorRunCount: number;
  },
  buyerPolished: boolean,
): number {
  if (!buyerPolished) {
    return point.totalEstimatedUsdSavings;
  }

  if (point.realRunCount === 0 && point.simulatorRunCount > 0) {
    return 0;
  }

  return point.realModeSavingsUsd;
}

/** Guard pin alias — sponsor dashboard trend section references this identifier. */
export const resolveExecutiveTrendSavingsUsd = resolveSponsorTrendSavingsUsd;

export function isBuyerRealEvidenceMode(mode: Parameters<typeof formatStructuralExecutionModeLabel>[0]): boolean {
  return formatStructuralExecutionModeLabel(mode) === StructuralExecutionModeWire.Real;
}

export function displayLabelNeverPromotesToReal(
  mode: Parameters<typeof formatStructuralExecutionModeLabel>[0],
  displayLabel: string,
): boolean {
  if (isBuyerRealEvidenceMode(mode)) {
    return true;
  }

  return displayLabel.trim() !== StructuralExecutionModeWire.Real;
}

export function findExecutionModeHonestyViolations(source: string, relativePath?: string): string[] {
  const violations: string[] = [];

  if (source.includes("Chart includes both Real and Simulator runs")
    && !source.includes("EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE")) {
    violations.push("inline-roi-period-mix-footnote");
  }

  if (/Mixed[\s\S]{0,80}Real mode evidence/i.test(source)) {
    violations.push("mixed-run-promoted-to-real-evidence");
  }

  if (relativePath?.endsWith("structural-execution-mode.ts")
    && !source.includes(EXECUTION_MODE_WITHIN_RUN_MIXED_BADGE_MARKER)) {
    violations.push("within-run-mixed-badge-copy-drift");
  }

  return violations;
}

export function withinRunMixedBadgeCopy(): string {
  return structuralExecutionModeBadgeTitle(StructuralExecutionModeWire.Mixed);
}
