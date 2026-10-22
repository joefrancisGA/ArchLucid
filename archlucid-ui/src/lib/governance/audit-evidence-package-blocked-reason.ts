import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { auditEvidenceSealedManifestConflictMessage } from "@/lib/governance/audit-evidence-sealed-manifest-conflict";

/** Wave-81 suggestion 964: surface lifecycle/sealed-hash audit evidence package 409 copy. */
export function auditEvidencePackageBlockedReason(failure: ApiLoadFailureState | null): string | null {
  if (failure === null) {
    return null;
  }

  return auditEvidenceSealedManifestConflictMessage(failure);
}
