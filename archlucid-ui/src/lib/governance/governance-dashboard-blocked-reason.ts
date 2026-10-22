import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-56 suggestion 666: surface lifecycle/sealed-hash governance dashboard 409 copy. */
export function governanceDashboardBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-56 suggestion 668: surface lifecycle/sealed-hash compliance drift trend 409 copy. */
export function complianceDriftTrendBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
