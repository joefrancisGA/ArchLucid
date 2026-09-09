import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-66 suggestion 787: surface lifecycle/sealed-hash advisory recommendation apply mutation 409 copy. */
export function advisoryRecommendationApplyMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
