import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { auditEvidenceSealedManifestConflictMessage } from "@/lib/governance/audit-evidence-sealed-manifest-conflict";

/** Wave-41 suggestion 477: surface lifecycle/sealed-hash lineage 409 copy instead of generic load failure. */
export function auditEvidenceLineageBlockedReason(failure: ApiLoadFailureState | null): string | null {
  if (failure === null) {
    return null;
  }

  return auditEvidenceSealedManifestConflictMessage(failure);
}
