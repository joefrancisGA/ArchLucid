"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { governanceStickinessSummaryBlockedReason } from "@/lib/governance/governance-stickiness-summary-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type GovernanceStickinessSummaryGuardCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-62 suggestion 735: fail-closed governance stickiness summary blocked-reason in operator governance UI. */
export function GovernanceStickinessSummaryGuardCallout(props: GovernanceStickinessSummaryGuardCalloutProps) {
  const blockedReason = governanceStickinessSummaryBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="governance-stickiness-summary-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
