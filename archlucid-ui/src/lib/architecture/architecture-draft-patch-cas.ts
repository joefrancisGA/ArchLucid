export const DRAFT_CAS_TOKEN_MISSING_CODE = "draft_cas_token_missing";
export const DRAFT_CAS_STALE_CODE = "draft_cas_stale";

export type DraftPatchCasFields = {
  readonly expectedUpdatedUtc?: string;
  readonly forceOverwrite?: boolean;
};

/**
 * Field payloads stay field-only. This wrapper is the only place CAS tokens attach (LW-038 / ADR 0088).
 */
export function withDraftPatchCas<T extends object>(
  payload: T,
  cas: { readonly expectedUpdatedUtc?: string | null; readonly forceOverwrite?: boolean },
): T & DraftPatchCasFields {
  if (cas.forceOverwrite === true) {
    return { ...payload, forceOverwrite: true };
  }

  const token = cas.expectedUpdatedUtc?.trim() ?? "";

  if (token.length === 0) {
    throw new Error("Draft PATCH CAS wrapper requires expectedUpdatedUtc unless forceOverwrite is true.");
  }

  return { ...payload, expectedUpdatedUtc: token };
}

export function draftPatchBodyHasCas(body: {
  readonly expectedUpdatedUtc?: string | null;
  readonly forceOverwrite?: boolean;
}): boolean {
  if (body.forceOverwrite === true) {
    return true;
  }

  return (body.expectedUpdatedUtc?.trim() ?? "").length > 0;
}

export function architectureDraftCasConflictMessage(code: string | null | undefined): string {
  if (code === DRAFT_CAS_TOKEN_MISSING_CODE) {
    return "This tab did not send a draft version token. Reload the server copy, or keep your edits with Keep mine. This is not another session overwriting you.";
  }

  return "This architecture was updated in another session or from offline replay. Keep your edits or load the server copy before saving again.";
}

export function readDraftCasConflictCode(error: {
  readonly problem?: { readonly errorCode?: string | null; readonly code?: string | null } | null;
}): string | null {
  const code = error.problem?.errorCode?.trim() || error.problem?.code?.trim() || "";

  if (code.length === 0) {
    return null;
  }

  return code;
}
