import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-71 suggestion 844: surface lifecycle/sealed-hash sponsor preliminary-share POST 409 copy. */
export function sponsorPreliminaryShareMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
