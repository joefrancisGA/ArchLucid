import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";

/** Wave-64 suggestion 763: surface lifecycle/sealed-hash quiet-engines hint 409 copy. */
export function governanceFindingsQueueQuietEnginesBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return runSummaryBlockedReason(failure);
}
