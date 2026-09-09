import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-60 suggestion 712: surface lifecycle/sealed-hash draft intake GET 409 copy. */
export function architectureDraftBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-65 suggestion 776: surface lifecycle/sealed-hash draft intake PATCH autosave 409 copy. */
export function architectureDraftAutosavePatchBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-66 suggestion 784: surface lifecycle/sealed-hash draft intake mutation POST 409 copy. */
export function architectureDraftIntakeMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}

/** Wave-67 suggestion 800: surface lifecycle/sealed-hash draft create POST 409 copy. */
export function architectureDraftCreateMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
