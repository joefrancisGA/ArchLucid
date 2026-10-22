import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-59 suggestion 699: surface lifecycle/sealed-hash reviews-awaiting register read 409 copy. */
export function reviewsAwaitingActionBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-59 suggestion 699: surface lifecycle/sealed-hash decisions-needed register read 409 copy. */
export function decisionsNeededSummaryBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
