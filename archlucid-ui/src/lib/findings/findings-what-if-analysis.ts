import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type FindingWhatIfInterval = {
  readonly lower: number | null;
  readonly upper: number | null;
  readonly reasoning: string | null;
};

type FindingWireCostData = {
  projectedImpactUsd?: unknown;
  payload?: {
    projectedImpactUsdLowerBound?: unknown;
    projectedImpactUsdUpperBound?: unknown;
    confidenceReasoning?: unknown;
  };
};

function parseFindingWireCostData(finding: QuickDecisionFinding): FindingWireCostData | null {
  if (finding === null || finding === undefined) {
    return null;
  }

  try {
    return JSON.parse(finding.aiReasoning.wireJson) as FindingWireCostData;
  } catch {
    return null;
  }
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

/** Projected annual USD savings carried on the finding wire payload (0 when absent or unparsable). */
export function readFindingProjectedImpactUsd(finding: QuickDecisionFinding): number {
  const parsed = parseFindingWireCostData(finding);

  if (parsed === null) {
    return 0;
  }

  return readFiniteNumber(parsed.projectedImpactUsd) ?? 0;
}

/** Confidence bounds for the projected impact, or null when the wire carries neither bound. */
export function readFindingProjectedImpactInterval(
  finding: QuickDecisionFinding,
): FindingWhatIfInterval | null {
  const parsed = parseFindingWireCostData(finding);
  const payload = parsed?.payload;

  if (payload === null || payload === undefined) {
    return null;
  }

  const lower = readFiniteNumber(payload.projectedImpactUsdLowerBound);
  const upper = readFiniteNumber(payload.projectedImpactUsdUpperBound);

  if (lower === null && upper === null) {
    return null;
  }

  return {
    lower,
    upper,
    reasoning: typeof payload.confidenceReasoning === "string" ? payload.confidenceReasoning : null,
  };
}

/**
 * True when the what-if panel has something to model: either a baseline cost to reduce,
 * or at least one finding carrying projected savings. Mirrors the panel's own null guard so
 * callers can drop the surrounding disclosure heading instead of rendering an empty one.
 */
export function hasFindingsWhatIfAnalysisContent(
  findings: readonly QuickDecisionFinding[],
  baselineAnnualCostUsd: number | null,
): boolean {
  if (baselineAnnualCostUsd !== null) {
    return true;
  }

  return findings.some((finding) => readFindingProjectedImpactUsd(finding) > 0);
}
