/**
 * Display helpers for governance approval lineage — keeps NaN/non-numeric API drift out of buyer-facing UI.
 */

/** Whole counts from lineage payloads. */
export function formatGovernanceLineageWholeCount(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value))
  {
    return "—";
  }

  return String(Math.round(value));
}

/** Completeness ratio in 0..1 to a whole percent label. */
export function formatGovernanceLineageCompletenessPercent(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value))
  {
    return "—";
  }

  return `${(value * 100).toFixed(0)}%`;
}
