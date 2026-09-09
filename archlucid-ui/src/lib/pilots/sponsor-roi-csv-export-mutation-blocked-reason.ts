import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-78 suggestion 928: surface lifecycle/sealed-hash sponsor ROI CSV export GET 409 copy. */
export function sponsorRoiCsvExportMutationBlockedReason(
  failure: ApiLoadFailureState | null,
): string | null {
  return compareRunPairBlockedReason(failure);
}
