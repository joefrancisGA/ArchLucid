import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-70 suggestions 831–832: surface lifecycle/sealed-hash architecture request lifecycle mutation 409 copy. */
export function architectureRequestLifecycleMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
