import {
  INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT,
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
  INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
} from "@/lib/quality/insight-density-measurement-denominator";

/** Advisory-only measurement floor copy — findings remain typed-engine-protected, not procurement attestations. */
export type InsightDensityMeasurementFloorCounts = {
  readonly catalogEngineCount: number;
  readonly measuredThisRunEngineCount: number | null;
  readonly harnessEngineCount: number;
};

export type InsightDensityMeasurementFloorPresentation = InsightDensityMeasurementFloorCounts & {
  readonly line: string;
  readonly helpHref: string;
  readonly meetsCareerExportFloor: boolean;
};

/** Minimum measured engines before Working career exports proceed without explicit incomplete confirmation (PC-01). */
export const INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES =
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT;

export function resolveInsightDensityMeasurementFloorCounts(
  enginesSucceeded: number | null | undefined,
): InsightDensityMeasurementFloorCounts {
  return {
    catalogEngineCount: INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT,
    measuredThisRunEngineCount: normalizeMeasuredEngineCount(enginesSucceeded),
    harnessEngineCount: INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
  };
}

function normalizeMeasuredEngineCount(enginesSucceeded: number | null | undefined): number | null {
  if (enginesSucceeded === null || enginesSucceeded === undefined || Number.isNaN(enginesSucceeded)) {
    return null;
  }

  return Math.max(0, Math.floor(enginesSucceeded));
}

function buildMeasurementFloorLine(counts: InsightDensityMeasurementFloorCounts): string {
  const measured = counts.measuredThisRunEngineCount;

  if (measured === null) {
    return `No engine coverage measured on this package yet. The product catalog includes ${counts.catalogEngineCount} built-in engines; the measurement floor expects at least ${counts.harnessEngineCount} engines to produce findings.`;
  }

  if (measured < counts.harnessEngineCount) {
    return `${measured} of ${counts.catalogEngineCount} catalog engines produced findings on this package. The sealed record may be honest but analytically incomplete.`;
  }

  return `${measured} of ${counts.catalogEngineCount} catalog engines produced findings on this package.`;
}

export function formatInsightDensityMeasurementFloorPresentation(
  enginesSucceeded: number | null | undefined,
): InsightDensityMeasurementFloorPresentation {
  const counts = resolveInsightDensityMeasurementFloorCounts(enginesSucceeded);
  const measured = counts.measuredThisRunEngineCount;
  const meetsCareerExportFloor =
    measured === null || measured >= INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES;

  return {
    ...counts,
    line: buildMeasurementFloorLine(counts),
    helpHref: INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
    meetsCareerExportFloor,
  };
}

export function formatInsightDensityMeasurementFloorBlockedReason(
  enginesSucceeded: number | null | undefined,
): string | null {
  const presentation = formatInsightDensityMeasurementFloorPresentation(enginesSucceeded);

  if (presentation.meetsCareerExportFloor) {
    return null;
  }

  const measured = presentation.measuredThisRunEngineCount ?? 0;

  return `Only ${measured} of ${presentation.catalogEngineCount} catalog engines produced findings — below the ${presentation.harnessEngineCount}-engine measurement floor for career export.`;
}
