import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { runSummaryBlockedReason } from "@/lib/runs/run-summary-blocked-reason";

/** Wave-64 suggestion 762: surface lifecycle/sealed-hash package print meeting-capture 409 copy. */
export function packagePrintMeetingCaptureBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return runSummaryBlockedReason(failure);
}
