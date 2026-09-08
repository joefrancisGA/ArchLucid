import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-49 suggestion 578: surface lifecycle/sealed-hash run detail page bundle 409 copy. */
export function runDetailPageBundleBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-49 suggestion 582: workspace-context bundle blocked reason alias. */
export function workspaceContextBundleBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return runDetailPageBundleBlockedReason(failure);
}
