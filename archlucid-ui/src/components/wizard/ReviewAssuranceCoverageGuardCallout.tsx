"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useGovernanceScopeCoverageQuery } from "@/hooks/use-governance-scope-coverage-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Wave-61 suggestion 728: fail-closed governance scope coverage blocked-reason on intake assurance. */
export function ReviewAssuranceCoverageGuardCallout() {
  const coverageQuery = useGovernanceScopeCoverageQuery({ enabled: true });

  if (coverageQuery.blockedReason === null && coverageQuery.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="review-assurance-coverage-blocked">
      {coverageQuery.failure ? <OperatorApiProblem failure={coverageQuery.failure} /> : null}
      {coverageQuery.blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {coverageQuery.blockedReason}
        </p>
      ) : null}
    </div>
  );
}
