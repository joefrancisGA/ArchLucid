import { listSkippedMustQuestionKeys } from "@/lib/review-quality/list-skipped-must-question-keys";
import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import type { DiffItem } from "@/types/authority";
import type { FeasibilityVerdictKind, TransparencyTrail } from "@/types/feasibility-verdict";

export type CompareProvenanceSideSummary = {
  readonly runId: string;
  readonly label: string;
  readonly trail: TransparencyTrail | null;
  readonly missingTrailDefect: boolean;
  readonly feasibilityVerdictKind: FeasibilityVerdictKind | null;
};

export type CompareProvenanceDeltaSummary = {
  readonly showBand: boolean;
  readonly baseline: CompareProvenanceSideSummary;
  readonly target: CompareProvenanceSideSummary;
  readonly assumptionDiffCount: number;
  readonly feasibilityVerdictChanged: boolean;
};

export function listCompareAssumptionDiffItems(diffs: readonly DiffItem[] | undefined): readonly DiffItem[] {
  if (diffs === undefined) {
    return [];
  }

  return diffs.filter((item) => item.section === "Assumptions");
}

function trailCounts(trail: TransparencyTrail | null): {
  readonly asserted: number;
  readonly inferred: number;
  readonly skippedMust: number;
} {
  if (trail === null) {
    return { asserted: 0, inferred: 0, skippedMust: 0 };
  }

  return {
    asserted: trail.asserted.length,
    inferred: trail.inferred.length,
    skippedMust: listSkippedMustQuestionKeys(trail).length,
  };
}

export function summarizeCompareProvenanceDelta(
  baseline: CompareProvenanceSideSummary,
  target: CompareProvenanceSideSummary,
  assumptionDiffs: readonly DiffItem[],
): CompareProvenanceDeltaSummary {
  const baselineCounts = trailCounts(baseline.trail);
  const targetCounts = trailCounts(target.trail);
  const assumptionDiffCount = assumptionDiffs.length;
  const feasibilityVerdictChanged =
    baseline.feasibilityVerdictKind !== null
    && target.feasibilityVerdictKind !== null
    && baseline.feasibilityVerdictKind !== target.feasibilityVerdictKind;
  const provenanceCountsDiffer =
    baselineCounts.asserted !== targetCounts.asserted
    || baselineCounts.inferred !== targetCounts.inferred
    || baselineCounts.skippedMust !== targetCounts.skippedMust;
  const showBand =
    baseline.missingTrailDefect
    || target.missingTrailDefect
    || provenanceCountsDiffer
    || assumptionDiffCount > 0
    || feasibilityVerdictChanged;

  return {
    showBand,
    baseline,
    target,
    assumptionDiffCount,
    feasibilityVerdictChanged,
  };
}
