import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-55 suggestion 656: surface lifecycle/sealed-hash temporal graph snapshot 409 copy. */
export function architectureGraphTemporalSnapshotBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
