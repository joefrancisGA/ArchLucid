import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-45 suggestion 530: surface lifecycle/sealed-hash sponsor dashboard bundle 409 copy. */
export function sponsorDashboardBundleBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
