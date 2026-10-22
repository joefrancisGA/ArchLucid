"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { governanceAssignedToMeCountBlockedReason } from "@/lib/governance/governance-assigned-to-me-count-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type GovernanceAssignedToMeCountBlockedCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-63 suggestion 744: fail-closed assigned-to-me count blocked-reason in governance chrome. */
export function GovernanceAssignedToMeCountBlockedCallout(
  props: GovernanceAssignedToMeCountBlockedCalloutProps,
) {
  const blockedReason = governanceAssignedToMeCountBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="governance-assigned-to-me-count-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} variant="warning" /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
