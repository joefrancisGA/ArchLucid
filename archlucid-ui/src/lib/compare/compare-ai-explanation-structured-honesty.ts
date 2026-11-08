export type CompareAiExplanationStructuredDeltaCounts = {
  readonly securityChangeCount: number | null;
  readonly costChangeCount: number | null;
};

export const COMPARE_AI_EXPLANATION_SECURITY_DELTA_NOT_STORED =
  "Security posture delta count was not stored on this comparison payload." as const;

export const COMPARE_AI_EXPLANATION_COST_DELTA_NOT_STORED =
  "Cost delta count was not stored on this comparison payload." as const;

export function formatCompareAiExplanationSecurityDeltaHonesty(
  count: number | null | undefined,
): string {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return COMPARE_AI_EXPLANATION_SECURITY_DELTA_NOT_STORED;
  }

  if (count === 0) {
    return "Structured comparison lists 0 security posture changes.";
  }

  if (count === 1) {
    return "Structured comparison lists 1 security posture change.";
  }

  return `Structured comparison lists ${count} security posture changes.`;
}

export function formatCompareAiExplanationCostDeltaHonesty(count: number | null | undefined): string {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return COMPARE_AI_EXPLANATION_COST_DELTA_NOT_STORED;
  }

  if (count === 0) {
    return "Structured comparison lists 0 modeled cost changes.";
  }

  if (count === 1) {
    return "Structured comparison lists 1 modeled cost change.";
  }

  return `Structured comparison lists ${count} modeled cost changes.`;
}
