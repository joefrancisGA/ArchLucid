"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { architectureGraphTemporalSnapshotBlockedReason } from "@/lib/graph/architecture-graph-temporal-snapshot-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureGraphTemporalSnapshotGuardCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-63 suggestion 746: fail-closed temporal graph snapshot blocked-reason in architecture graph viewer. */
export function ArchitectureGraphTemporalSnapshotGuardCallout(
  props: ArchitectureGraphTemporalSnapshotGuardCalloutProps,
) {
  const blockedReason = architectureGraphTemporalSnapshotBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="architecture-graph-temporal-snapshot-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} variant="warning" /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
