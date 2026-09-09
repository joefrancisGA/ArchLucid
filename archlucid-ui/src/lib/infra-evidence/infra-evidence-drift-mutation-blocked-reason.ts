import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { infraEvidenceSnapshotsLoadBlockedReason } from "@/lib/infra-evidence/infra-evidence-snapshots-load-blocked-reason";

/** Wave-79 suggestion 942: surface lifecycle/sealed-hash drift workbench 409 copy. */
export function infraEvidenceDriftMutationBlockedReason(failure: ApiLoadFailureState | null): string | null {
  return infraEvidenceSnapshotsLoadBlockedReason(failure);
}
