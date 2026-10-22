import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-61 suggestion 723: surface lifecycle/sealed-hash draft list 409 copy. */
export function architectureDraftListBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-61 suggestion 724: surface lifecycle/sealed-hash draft questions and branch-quota 409 copy. */
export function architectureDraftQuestionsBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

export function architectureDraftBranchQuotaBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
