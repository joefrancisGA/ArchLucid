"use client";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { governanceReviewContextBlockedReason } from "@/lib/governance/governance-review-context-blocked-reason";

export type GovernanceReviewContextBlockedCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

export function GovernanceReviewContextBlockedCallout(
  props: GovernanceReviewContextBlockedCalloutProps,
): React.JSX.Element | null {
  const blockedReason = governanceReviewContextBlockedReason(props.failure);

  if (blockedReason === null) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4"
      data-testid="governance-review-context-blocked"
    >
      <OperatorApiProblem
        problem={props.failure?.problem ?? null}
        fallbackMessage={blockedReason}
        correlationId={props.failure?.correlationId ?? null}
        variant="warning"
      />
    </div>
  );
}
