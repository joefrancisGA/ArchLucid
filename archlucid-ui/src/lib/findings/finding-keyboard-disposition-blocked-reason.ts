import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-65 suggestion 772: surface lifecycle/sealed-hash keyboard finding disposition POST 409 copy. */
export function findingKeyboardDispositionBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
