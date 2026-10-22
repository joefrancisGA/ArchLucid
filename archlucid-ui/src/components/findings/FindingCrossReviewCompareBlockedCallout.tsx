"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FindingCrossReviewCompareBlockedCalloutProps = {
  readonly error: unknown;
};

/** Wave-62 suggestion 740: fail-closed end-to-end compare blocked-reason on finding lifecycle hint. */
export function FindingCrossReviewCompareBlockedCallout(props: FindingCrossReviewCompareBlockedCalloutProps) {
  const failure: ApiLoadFailureState | null = props.error !== null && props.error !== undefined
    ? toApiLoadFailure(props.error)
    : null;
  const blockedReason = compareRunPairBlockedReason(failure);

  if (blockedReason === null && failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="finding-cross-review-compare-blocked">
      {failure ? <OperatorApiProblem failure={failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
