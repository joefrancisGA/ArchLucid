import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-55 suggestion 653: surface lifecycle/sealed-hash governance approval lineage/rationale 409 copy. */
export function governanceApprovalLineageBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
