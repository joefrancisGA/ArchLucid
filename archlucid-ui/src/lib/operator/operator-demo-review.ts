/** UI constants aligned with `ArchLucid.Api.Demo.OperatorDemoReviewPresets` (no backend coupling). */

export const OPERATOR_DEMO_REVIEW_SYSTEM_DISPLAY_NAME = "Acme Corp HR Portal (Policy Demo)";

export const OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX =
  "Azure-hosted HR self-service portal for 12,000 employees.";

export const OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER =
  "Demonstration-only one-click review path";

export const OPERATOR_DEMO_REVIEW_POLICY_PACK_DISPLAY_NAME = "Security Architecture Baseline";

export type OperatorDemoReviewRunSignals = {
  readonly description?: string | null;
  readonly displayName?: string | null;
  readonly headline?: string | null;
};

function nonEmpty(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** True when run summary/detail copy matches the operator one-click demo review preset. */
export function isOperatorDemoReviewRun(signals: OperatorDemoReviewRunSignals): boolean {
  const description = nonEmpty(signals.description);
  const displayName = nonEmpty(signals.displayName);
  const headline = nonEmpty(signals.headline);

  if (displayName === OPERATOR_DEMO_REVIEW_SYSTEM_DISPLAY_NAME) {
    return true;
  }

  if (headline === OPERATOR_DEMO_REVIEW_SYSTEM_DISPLAY_NAME) {
    return true;
  }

  if (description.startsWith(OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX)) {
    return true;
  }

  if (description.includes(OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER)) {
    return true;
  }

  return false;
}
