import { formatRemediationFactoryPercentDisplay } from "@/lib/remediation-factory/remediation-factory-percent-format";

/**
 * Display helpers for approval lineage — keeps NaN/non-numeric API drift out of buyer-facing UI.
 */

/** Whole counts from lineage payloads. */
export function formatGovernanceLineageWholeCount(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value))
  {
    return " — ";
  }

  return String(Math.round(value));
}

/** Completeness ratio in 0..1 or 0..100 to a whole percent label (UU-483). */
export function formatGovernanceLineageCompletenessPercent(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value))
  {
    return "Not recorded";
  }

  return formatRemediationFactoryPercentDisplay(value);
}
