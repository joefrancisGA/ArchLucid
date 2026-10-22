import { toApiLoadFailure } from "@/lib/api-load-failure";

const DEFAULT_EXPORT_SEALED_MANIFEST_CONFLICT_COPY =
  "Export blocked: sealed manifest verification failed. Resolve lifecycle and hash integrity on the linked review before retrying.";

/** Wave-41 suggestion 488: surface lifecycle/sealed-hash 409 copy for binary export downloads. */
export function exportSealedManifestConflictMessage(error: unknown): string | null {
  const failure = toApiLoadFailure(error);

  if (failure.httpStatus !== 409) {
    return null;
  }

  const detail = failure.problem?.detail?.trim() ?? failure.message.trim();

  if (detail.length > 0) {
    return detail;
  }

  return DEFAULT_EXPORT_SEALED_MANIFEST_CONFLICT_COPY;
}

export function formatExportSealedManifestAwareApiError(error: unknown): string {
  const conflictMessage = exportSealedManifestConflictMessage(error);

  if (conflictMessage !== null) {
    return conflictMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
