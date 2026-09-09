import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-72 suggestion 858: surface lifecycle/sealed-hash sponsor value-report DOCX POST 409 copy. */
export function sponsorValueReportDocxMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
