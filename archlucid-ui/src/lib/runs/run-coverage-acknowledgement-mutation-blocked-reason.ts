import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-67 suggestion 796: surface lifecycle/sealed-hash run coverage acknowledgement PUT 409 copy. */
export function runCoverageAcknowledgementMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
