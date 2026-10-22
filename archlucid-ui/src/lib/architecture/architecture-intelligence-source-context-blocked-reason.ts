import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-51 suggestion 605: surface lifecycle/sealed-hash Architecture Intelligence source-context 409 copy. */
export function architectureIntelligenceSourceContextBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
