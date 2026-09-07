import { ACTOR_DEPENDENT_FINDING_ENGINE_TYPES } from "@/lib/findings/actor-dependent-finding-engine-types";
import {
  INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT,
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
  INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
} from "@/lib/quality/insight-density-measurement-denominator";

/**
 * claimBoundary: advisory measurement floor — not G-REAL-06 procurement proof.
 * `typed-engine-protected` demotions stay advisory checklist rows; this floor only gates career export completeness.
 */
export type InsightDensityMeasurementFloorCounts = {
  readonly catalogEngineCount: number;
  readonly measuredThisRunEngineCount: number | null;
  readonly harnessEngineCount: number;
};

export type InsightDensityMeasurementFloorOptions = {
  readonly actorNodeCount?: number;
  readonly analysisStagesComplete?: boolean;
  readonly judgeSkippedByCap?: number | null;
};

export type InsightDensityMeasurementFloorPresentation = InsightDensityMeasurementFloorCounts & {
  readonly line: string;
  readonly helpHref: string;
  readonly meetsCareerExportFloor: boolean;
  readonly skippedActorEngineTypes: readonly string[];
  readonly judgeSkippedByCap: number | null;
};

/** Minimum measured engines before Working career exports proceed without explicit incomplete confirmation (PC-01). */
export const INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES =
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT;

export function deriveSkippedActorEngineTypes(
  actorNodeCount: number,
  analysisStagesComplete: boolean,
): readonly string[] {
  if (!analysisStagesComplete || actorNodeCount > 0) {
    return [];
  }

  return ACTOR_DEPENDENT_FINDING_ENGINE_TYPES;
}

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

function normalizeJudgeSkippedByCap(judgeSkippedByCap: number | null | undefined): number | null {
  if (judgeSkippedByCap === null || judgeSkippedByCap === undefined || Number.isNaN(judgeSkippedByCap)) {
    return null;
  }

  const normalized = Math.max(0, Math.floor(judgeSkippedByCap));

  return normalized > 0 ? normalized : null;
}

function appendMeasurementFloorHonestySuffixes(
  baseLine: string,
  skippedActorEngineTypes: readonly string[],
  judgeSkippedByCap: number | null,
): string {
  const suffixes: string[] = [];

  if (skippedActorEngineTypes.length > 0) {
    suffixes.push(
      `Skipped actor-dependent engines (${skippedActorEngineTypes.join(", ")}) — this graph has no Actor nodes.`,
    );
  }

  if (judgeSkippedByCap !== null) {
    suffixes.push(
      judgeSkippedByCap === 1
        ? "Premium insight-density judge skipped 1 finding by per-snapshot cap."
        : `Premium insight-density judge skipped ${judgeSkippedByCap} findings by per-snapshot cap.`,
    );
  }

  if (suffixes.length === 0) {
    return baseLine;
  }

  return `${baseLine} ${suffixes.join(" ")}`;
}

function buildMeasurementFloorLine(
  counts: InsightDensityMeasurementFloorCounts,
  skippedActorEngineTypes: readonly string[],
  judgeSkippedByCap: number | null,
): string {
  const measured = counts.measuredThisRunEngineCount;
  let baseLine: string;

  if (measured === null) {
    baseLine = `No engine coverage measured on this package yet. The product catalog includes ${counts.catalogEngineCount} built-in engines; the measurement floor expects at least ${counts.harnessEngineCount} engines to produce findings.`;
  } else if (measured < counts.harnessEngineCount) {
    baseLine = `${measured} of ${counts.catalogEngineCount} catalog engines produced findings on this package. The sealed record may be honest but analytically incomplete.`;
  } else {
    baseLine = `${measured} of ${counts.catalogEngineCount} catalog engines produced findings on this package.`;
  }

  return appendMeasurementFloorHonestySuffixes(baseLine, skippedActorEngineTypes, judgeSkippedByCap);
}

export function formatInsightDensityMeasurementFloorPresentation(
  enginesSucceeded: number | null | undefined,
  options: InsightDensityMeasurementFloorOptions = {},
): InsightDensityMeasurementFloorPresentation {
  const counts = resolveInsightDensityMeasurementFloorCounts(enginesSucceeded);
  const measured = counts.measuredThisRunEngineCount;
  const meetsCareerExportFloor =
    measured !== null && measured >= INSIGHT_DENSITY_CAREER_EXPORT_MEASUREMENT_FLOOR_MIN_ENGINES;
  const skippedActorEngineTypes = deriveSkippedActorEngineTypes(
    Math.max(0, Math.floor(options.actorNodeCount ?? 0)),
    options.analysisStagesComplete === true,
  );
  const judgeSkippedByCap = normalizeJudgeSkippedByCap(options.judgeSkippedByCap);

  return {
    ...counts,
    line: buildMeasurementFloorLine(counts, skippedActorEngineTypes, judgeSkippedByCap),
    helpHref: INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
    meetsCareerExportFloor,
    skippedActorEngineTypes,
    judgeSkippedByCap,
  };
}

export function formatInsightDensityMeasurementFloorBlockedReason(
  enginesSucceeded: number | null | undefined,
  catalogAdvisoryEngineFailureCount: number = 0,
): string | null {
  if (catalogAdvisoryEngineFailureCount > 0) {
    return catalogAdvisoryEngineFailureCount === 1
      ? "1 catalog engine failed or did not run — career export requires typed findings from every catalog engine that executed."
      : `${catalogAdvisoryEngineFailureCount} catalog engines failed or did not run — career export requires complete typed-engine coverage for this package.`;
  }

  const presentation = formatInsightDensityMeasurementFloorPresentation(enginesSucceeded);

  if (presentation.meetsCareerExportFloor) {
    return null;
  }

  if (presentation.measuredThisRunEngineCount === null) {
    return `Engine coverage has not been measured on this package — career export requires at least ${presentation.harnessEngineCount} catalog engines to produce findings.`;
  }

  const measured = presentation.measuredThisRunEngineCount;

  return `Only ${measured} of ${presentation.catalogEngineCount} catalog engines produced findings — below the ${presentation.harnessEngineCount}-engine measurement floor for career export.`;
}
