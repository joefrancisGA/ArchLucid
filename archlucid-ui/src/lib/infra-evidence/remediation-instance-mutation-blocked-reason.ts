import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-78 suggestion 932: surface lifecycle/sealed-hash remediation instance mutation 409 copy. */
export function remediationInstanceMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
