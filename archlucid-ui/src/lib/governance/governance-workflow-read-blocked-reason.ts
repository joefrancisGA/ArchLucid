import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-57 suggestion 679: surface lifecycle/sealed-hash governance setup guide and resolution 409 copy. */
export function governanceSetupGuideBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

export function governanceResolutionBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-57 suggestion 680: surface lifecycle/sealed-hash environment catalog 409 copy. */
export function governanceEnvironmentCatalogBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
