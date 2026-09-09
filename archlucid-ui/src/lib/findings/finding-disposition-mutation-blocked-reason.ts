import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-67 suggestion 797: surface lifecycle/sealed-hash finding disposition POST mutation 409 copy. */
export function findingDispositionMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
