"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type PriorSameRequestCompareFallbackBlockedCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-63 suggestion 752: fail-closed prior same-request compare fallback blocked-reason. */
export function PriorSameRequestCompareFallbackBlockedCallout(
  props: PriorSameRequestCompareFallbackBlockedCalloutProps,
) {
  const blockedReason = runSummaryBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="prior-same-request-compare-fallback-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} variant="warning" /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
