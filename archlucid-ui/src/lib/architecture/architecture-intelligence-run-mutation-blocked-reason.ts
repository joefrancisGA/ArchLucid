import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-72 suggestion 855: surface lifecycle/sealed-hash architecture-intelligence mutation POST 409 copy. */
export function architectureIntelligenceRunMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
