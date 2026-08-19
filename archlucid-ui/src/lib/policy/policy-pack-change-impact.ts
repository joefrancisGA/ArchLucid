/**
 * Honest policy-pack assign/activate change-impact preview copy (TB-2215).
 * Does not invent severity-change counts when the API has not provided an estimate.
 */

export type PolicyPackChangeImpactPreviewInput = {
  readonly findingCount: number;
  readonly severityChangeEstimate?: number | null;
};

export type PolicyPackChangeImpactPreview = {
  readonly title: string;
  readonly body: string;
  readonly findingContext: string | null;
  readonly hasSeverityEstimate: boolean;
};

export const POLICY_PACK_CHANGE_IMPACT_TITLE = "Policy pack change impact";

/** Canonical body when no severity-change estimate is available from the API. */
export const POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY =
  "Assigning this pack may change finding severity on next execute";

function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function formatFindingContext(findingCount: number): string | null {
  if (findingCount <= 0) {
    return null;
  }

  const noun = findingCount === 1 ? "finding" : "findings";

  return `${findingCount} ${noun} in scope may be re-evaluated after the next execute.`;
}

function formatSeverityEstimateBody(severityChangeEstimate: number): string {
  const count = Math.abs(normalizeNonNegativeInt(severityChangeEstimate));
  const noun = count === 1 ? "finding" : "findings";

  return `Assigning this pack may change severity for about ${count} ${noun} on next execute.`;
}

export function buildPolicyPackChangeImpactPreview(
  input: PolicyPackChangeImpactPreviewInput,
): PolicyPackChangeImpactPreview {
  const findingCount = normalizeNonNegativeInt(input.findingCount);
  const estimateRaw = input.severityChangeEstimate;
  const hasSeverityEstimate =
    estimateRaw !== undefined && estimateRaw !== null && Number.isFinite(estimateRaw);

  return {
    title: POLICY_PACK_CHANGE_IMPACT_TITLE,
    body: hasSeverityEstimate
      ? formatSeverityEstimateBody(estimateRaw as number)
      : POLICY_PACK_CHANGE_IMPACT_NO_ESTIMATE_BODY,
    findingContext: formatFindingContext(findingCount),
    hasSeverityEstimate,
  };
}