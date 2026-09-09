import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-68 suggestion 811: surface lifecycle/sealed-hash run operator governance disposition POST 409 copy. */
export function runOperatorGovernanceDispositionMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
