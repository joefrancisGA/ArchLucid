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

/** Projected annual USD savings on the finding wire payload, or null when omitted or unparsable. */
export function readFindingProjectedImpactUsd(finding: QuickDecisionFinding): number | null {
  const parsed = parseFindingWireCostData(finding);

  if (parsed === null) {
    return null;
  }

  return readFiniteNumber(parsed.projectedImpactUsd);
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
export type WhatIfSelectedSavingsRollup = {
  readonly totalUsd: number | null;
  readonly incomplete: boolean;
};

/** Sums projected savings for selected findings; does not treat omitted impact as zero. */
export function rollupWhatIfSelectedProjectedSavingsUsd(
  rows: readonly { readonly findingId: string; readonly savingsUsd: number | null }[],
  selectedIds: ReadonlySet<string>,
  enabled: boolean,
): WhatIfSelectedSavingsRollup {
  if (!enabled || selectedIds.size === 0) {
    return { totalUsd: 0, incomplete: false };
  }

  let totalUsd = 0;
  let incomplete = false;

  for (const row of rows) {
    if (!selectedIds.has(row.findingId)) {
      continue;
    }

    if (row.savingsUsd === null) {
      incomplete = true;
      continue;
    }

    totalUsd += row.savingsUsd;
  }

  return {
    totalUsd: incomplete ? null : totalUsd,
    incomplete,
  };
}

export const FINDINGS_WHAT_IF_PROJECTED_COST_NOT_STORED = "Projected cost was not stored." as const;

export const FINDINGS_WHAT_IF_PROJECTED_SAVINGS_INCOMPLETE_COPY =
  "Projected savings total is incomplete — one or more selected findings did not store projected impact." as const;

export const FINDINGS_WHAT_IF_PROJECTED_COST_ILLUSTRATIVE_COPY =
  "Projected cost uses illustrative pricing — not measured tenant spend." as const;

export const FINDINGS_WHAT_IF_PROJECTED_SAVINGS_ILLUSTRATIVE_COPY =
  "Projected savings are illustrative — not measured tenant spend." as const;

export const FINDINGS_WHAT_IF_PROJECTED_ZERO_SAVINGS_LABEL = "$0" as const;

export function hasFindingsWhatIfAnalysisContent(
  findings: readonly QuickDecisionFinding[],
  baselineAnnualCostUsd: number | null,
): boolean {
  if (baselineAnnualCostUsd !== null) {
    return true;
  }

  return findings.some((finding) => {
    const savings = readFindingProjectedImpactUsd(finding);

    return savings !== null && savings > 0;
  });
}
