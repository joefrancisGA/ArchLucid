import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-72 suggestion 856: surface lifecycle/sealed-hash board-pack PDF POST 409 copy. */
export function boardPackMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
