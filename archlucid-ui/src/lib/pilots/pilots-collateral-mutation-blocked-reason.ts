import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-73 suggestion 868: surface lifecycle/sealed-hash pilot collateral GET 409 copy. */
export function pilotsCollateralMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
