import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";

/** Wave-64 suggestion 761: surface lifecycle/sealed-hash Ask coverage honesty 409 copy. */
export function askRunCoverageHonestyBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return runSummaryBlockedReason(failure);
}
