import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunPairBlockedReason } from "@/lib/compare/compare-run-pair-blocked-reason";

/** Wave-75 suggestion 893: surface lifecycle/sealed-hash Terraform advisory ZIP GET 409 copy. */
export function terraformAdvisoryExportMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return compareRunPairBlockedReason(failure);
}
