import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-57 suggestion 677: surface lifecycle/sealed-hash risk exceptions list 409 copy. */
export function riskExceptionsBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-57 suggestion 678: surface lifecycle/sealed-hash recurrence schedules list 409 copy. */
export function recurrenceSchedulesBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
