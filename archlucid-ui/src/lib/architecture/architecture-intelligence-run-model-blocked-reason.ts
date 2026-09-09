import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-52 suggestion 617: surface lifecycle/sealed-hash architecture-intelligence run model 409 copy. */
export function architectureIntelligenceRunModelBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
