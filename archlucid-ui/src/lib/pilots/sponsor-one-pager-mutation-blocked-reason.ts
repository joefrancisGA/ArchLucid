import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-72 suggestion 859: surface lifecycle/sealed-hash sponsor one-pager PDF POST 409 copy. */
export function sponsorOnePagerMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
