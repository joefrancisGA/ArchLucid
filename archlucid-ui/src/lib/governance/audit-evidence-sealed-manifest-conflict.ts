import { toApiLoadFailure } from "@/lib/api-load-failure";

const DEFAULT_AUDIT_EVIDENCE_SEALED_MANIFEST_CONFLICT_COPY =
  "Audit evidence operation blocked: sealed manifest verification failed. Resolve lifecycle and hash integrity on the linked review before retrying.";

/** Wave-41 suggestions 477–478: surface lifecycle/sealed-hash 409 copy for audit evidence lineage and package export. */
export function auditEvidenceSealedManifestConflictMessage(error: unknown): string | null {
  const failure = toApiLoadFailure(error);

  if (failure.httpStatus !== 409) {
    return null;
  }

  const detail = failure.problem?.detail?.trim() ?? failure.message.trim();

  if (detail.length > 0) {
    return detail;
  }

  return DEFAULT_AUDIT_EVIDENCE_SEALED_MANIFEST_CONFLICT_COPY;
}

export function formatAuditEvidenceSealedManifestAwareApiError(error: unknown): string {
  const conflictMessage = auditEvidenceSealedManifestConflictMessage(error);

  if (conflictMessage !== null) {
    return conflictMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
