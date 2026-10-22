import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-43 suggestion 505–506: surface lifecycle/sealed-hash Ask stream 409 copy. */
export function askBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

export function formatAskStreamHttpError(failure: ApiLoadFailureState): string {
  return askBlockedReason(failure) ?? failure.message;
}
