"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FindingInspectDispositionBlockedCalloutProps = {
  readonly blockedReason: string | null;
  readonly failure?: ApiLoadFailureState | null;
};

/** Wave-62 suggestion 732: fail-closed finding disposition history blocked-reason on inspect governance. */
export function FindingInspectDispositionBlockedCallout(props: FindingInspectDispositionBlockedCalloutProps) {
  if (props.blockedReason === null && (props.failure ?? null) === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="finding-inspect-disposition-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} /> : null}
      {props.blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.blockedReason}</p>
      ) : null}
    </div>
  );
}
