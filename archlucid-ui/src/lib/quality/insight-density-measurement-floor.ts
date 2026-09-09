import { ACTOR_DEPENDENT_FINDING_ENGINE_TYPES } from "@/lib/findings/actor-dependent-finding-engine-types";
import {
  formatJudgeCapReductionClause,
  type JudgeCapReductionFromFindingsSnapshot,
} from "@/lib/findings/read-judge-skipped-by-cap";
import type { HeldCheckLedgerRollupEntry, HeldCheckSecondPassSummary } from "@/lib/findings/read-held-check-ledger-from-findings-snapshot";
import type { ProseAssumptionHeldCheckAsk } from "@/lib/findings/read-prose-assumption-held-check-asks-from-findings-snapshot";
import type { ProseAssumptionRegisterEntry } from "@/lib/findings/read-prose-assumption-register-from-findings-snapshot";
import {
  formatProseAssumptionRegisterLabels,
} from "@/lib/findings/read-prose-assumption-register-from-findings-snapshot";
import {
  formatPixelDiagramNotVerifiableLabels,
  type PixelDiagramNotVerifiableSource,
} from "@/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources";
import {
  formatHeldCheckInputCodeLabel,
  formatHeldCheckUnblockClause,
  formatProseAssumptionHeldCheckAskClause,
} from "@/lib/quality/held-check-input-code";
import {
  INSIGHT_DENSITY_BUILT_IN_PRODUCT_ENGINE_COUNT,
  INSIGHT_DENSITY_GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
  INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
} from "@/lib/quality/insight-density-measurement-denominator";

export type { HeldCheckLedgerRollupEntry, HeldCheckSecondPassSummary };
export type { ProseAssumptionHeldCheckAsk };
export type { ProseAssumptionRegisterEntry };
export type { PixelDiagramNotVerifiableSource };
export { formatProseAssumptionRegisterLabels };
export { formatPixelDiagramNotVerifiableLabels };

/**
 * claimBoundary: advisory measurement floor — not G-REAL-06 procurement proof.
 * `typed-engine-scored` demotions stay advisory checklist rows; this floor only gates career export completeness.
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
  readonly judgeConfiguredCap?: number | null;
  readonly judgeEffectiveCap?: number | null;
  readonly heldCheckLedgerEntries?: readonly HeldCheckLedgerRollupEntry[];
  readonly heldCheckSecondPass?: HeldCheckSecondPassSummary | null;
  readonly proseAssumptionRegisterEntries?: readonly ProseAssumptionRegisterEntry[];
  readonly proseAssumptionHeldCheckAsks?: readonly ProseAssumptionHeldCheckAsk[];
  readonly pixelDiagramNotVerifiableSources?: readonly PixelDiagramNotVerifiableSource[];
};

export type InsightDensityMeasurementFloorPresentation = InsightDensityMeasurementFloorCounts & {
  readonly line: string;
  readonly helpHref: string;
  readonly meetsCareerExportFloor: boolean;
  readonly skippedActorEngineTypes: readonly string[];
  readonly judgeSkippedByCap: number | null;
  readonly heldCheckLedgerEntries: readonly HeldCheckLedgerRollupEntry[];
  readonly topHeldCheckUnblockClause: string | null;
  readonly heldCheckSecondPassClause: string | null;
  readonly proseAssumptionRegisterEntries: readonly ProseAssumptionRegisterEntry[];
  readonly proseAssumptionRegisterLabels: readonly string[];
  readonly pixelDiagramNotVerifiableSources: readonly PixelDiagramNotVerifiableSource[];
  readonly pixelDiagramNotVerifiableLabels: readonly string[];
  readonly proseAssumptionHeldCheckAsks: readonly ProseAssumptionHeldCheckAsk[];
  readonly proseAssumptionHeldCheckClause: string | null;
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

function resolveTopHeldCheckUnblockClause(entries: readonly HeldCheckLedgerRollupEntry[]): string | null {
  if (entries.length === 0 || entries[0].engineCount < 2) {
    return null;
  }

  return formatHeldCheckUnblockClause(entries[0].engineCount, entries[0].inputCode);
}

function resolveProseAssumptionHeldCheckClause(
  asks: readonly ProseAssumptionHeldCheckAsk[],
): string | null {
  if (asks.length === 0) {
    return null;
  }

  return formatProseAssumptionHeldCheckAskClause(asks[0]);
}

function formatHeldCheckSecondPassClause(summary: HeldCheckSecondPassSummary | null | undefined): string | null {
  if (summary === null || summary === undefined) {
    return null;
  }

  if (summary.status !== "completed" || summary.newDecisionGradeCount < 1) {
    return null;
  }

  const label = formatHeldCheckInputCodeLabel(summary.inputCode);
  const count = summary.unblockedEngineCount;

  return count === 1
    ? `Re-ran after ${label}: 1 previously held engine produced findings.`
    : `Re-ran after ${label}: ${count} previously held engines produced findings.`;
}

function resolveJudgeCapReductionClause(
  configuredCap: number | null | undefined,
  effectiveCap: number | null | undefined,
): string | null {
  if (
    configuredCap === null
    || configuredCap === undefined
    || effectiveCap === null
    || effectiveCap === undefined
    || Number.isNaN(configuredCap)
    || Number.isNaN(effectiveCap)
    || configuredCap <= 0
    || effectiveCap >= configuredCap
  ) {
    return null;
  }

  const reduction: JudgeCapReductionFromFindingsSnapshot = {
    configuredCap: Math.trunc(configuredCap),
    effectiveCap: Math.max(0, Math.trunc(effectiveCap)),
  };

  return formatJudgeCapReductionClause(reduction);
}

function appendMeasurementFloorHonestySuffixes(
  baseLine: string,
  skippedActorEngineTypes: readonly string[],
  judgeSkippedByCap: number | null,
  judgeCapReductionClause: string | null,
  topHeldCheckUnblockClause: string | null,
  proseAssumptionHeldCheckClause: string | null,
  heldCheckSecondPassClause: string | null,
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

  if (judgeCapReductionClause !== null) {
    suffixes.push(judgeCapReductionClause);
  }

  if (topHeldCheckUnblockClause !== null) {
    suffixes.push(topHeldCheckUnblockClause);
  }

  if (proseAssumptionHeldCheckClause !== null) {
    suffixes.push(proseAssumptionHeldCheckClause);
  }

  if (heldCheckSecondPassClause !== null) {
    suffixes.push(heldCheckSecondPassClause);
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
  judgeCapReductionClause: string | null,
  topHeldCheckUnblockClause: string | null,
  proseAssumptionHeldCheckClause: string | null,
  heldCheckSecondPassClause: string | null,
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

  return appendMeasurementFloorHonestySuffixes(
    baseLine,
    skippedActorEngineTypes,
    judgeSkippedByCap,
    judgeCapReductionClause,
    topHeldCheckUnblockClause,
    proseAssumptionHeldCheckClause,
    heldCheckSecondPassClause,
  );
}

export function formatHeldCheckLedgerRankedLabels(
  entries: readonly HeldCheckLedgerRollupEntry[],
): readonly string[] {
  return entries.map(
    (entry) => `${formatHeldCheckInputCodeLabel(entry.inputCode)} (${entry.engineCount} engine${entry.engineCount === 1 ? "" : "s"})`,
  );
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
  const judgeCapReductionClause = resolveJudgeCapReductionClause(
    options.judgeConfiguredCap,
    options.judgeEffectiveCap,
  );
  const heldCheckLedgerEntries = options.heldCheckLedgerEntries ?? [];
  const topHeldCheckUnblockClause = resolveTopHeldCheckUnblockClause(heldCheckLedgerEntries);
  const heldCheckSecondPassClause = formatHeldCheckSecondPassClause(options.heldCheckSecondPass);
  const proseAssumptionRegisterEntries = options.proseAssumptionRegisterEntries ?? [];
  const proseAssumptionRegisterLabels = formatProseAssumptionRegisterLabels(proseAssumptionRegisterEntries);
  const pixelDiagramNotVerifiableSources = options.pixelDiagramNotVerifiableSources ?? [];
  const pixelDiagramNotVerifiableLabels = formatPixelDiagramNotVerifiableLabels(pixelDiagramNotVerifiableSources);
  const proseAssumptionHeldCheckAsks = options.proseAssumptionHeldCheckAsks ?? [];
  const proseAssumptionHeldCheckClause = resolveProseAssumptionHeldCheckClause(proseAssumptionHeldCheckAsks);

  return {
    ...counts,
    line: buildMeasurementFloorLine(
      counts,
      skippedActorEngineTypes,
      judgeSkippedByCap,
      judgeCapReductionClause,
      topHeldCheckUnblockClause,
      proseAssumptionHeldCheckClause,
      heldCheckSecondPassClause,
    ),
    helpHref: INSIGHT_DENSITY_MEASUREMENT_DENOMINATOR_HELP_HREF,
    meetsCareerExportFloor,
    skippedActorEngineTypes,
    judgeSkippedByCap,
    heldCheckLedgerEntries,
    topHeldCheckUnblockClause,
    heldCheckSecondPassClause,
    proseAssumptionRegisterEntries,
    proseAssumptionRegisterLabels,
    pixelDiagramNotVerifiableSources,
    pixelDiagramNotVerifiableLabels,
    proseAssumptionHeldCheckAsks,
    proseAssumptionHeldCheckClause,
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
