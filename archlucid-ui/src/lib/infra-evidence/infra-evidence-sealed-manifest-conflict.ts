import { toApiLoadFailure } from "@/lib/api-load-failure";

const DEFAULT_SEALED_MANIFEST_CONFLICT_COPY =
  "Operation blocked: sealed manifest verification failed. Resolve lifecycle and hash integrity on the linked review before retrying.";

/** Wave-39 suggestions 462–463: surface lifecycle/sealed-hash 409 copy for infra-evidence workbenches. */
export function infraEvidenceSealedManifestConflictMessage(error: unknown): string | null {
  const failure = toApiLoadFailure(error);

  if (failure.httpStatus !== 409) {
    return null;
  }

  const detail = failure.problem?.detail?.trim() ?? failure.message.trim();

  if (detail.length > 0) {
    return detail;
  }

  return DEFAULT_SEALED_MANIFEST_CONFLICT_COPY;
}

export function formatInfraEvidenceSealedManifestAwareApiError(error: unknown): string {
  const conflictMessage = infraEvidenceSealedManifestConflictMessage(error);

  if (conflictMessage !== null) {
    return conflictMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
