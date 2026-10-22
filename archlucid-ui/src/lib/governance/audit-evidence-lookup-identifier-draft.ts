/**
 * Versioned local draft for audit evidence lookup identifier fields (COA / GOA).
 * Storage key namespaces schema version (`archlucid.auditEvidenceLookupIdentifiers.v1`).
 */

export const AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY =
  "archlucid.auditEvidenceLookupIdentifiers.v1" as const;

export type AuditEvidenceLookupIdentifierDraftV1 = {
  readonly schemaVersion: 1;
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
  readonly updatedAtUtc: string;
};

export type AuditEvidenceLookupIdentifierFields = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

function emptyDraft(): AuditEvidenceLookupIdentifierDraftV1 {
  return {
    schemaVersion: 1,
    assessmentId: "",
    snapshotId: "",
    controlId: "",
    updatedAtUtc: new Date().toISOString(),
  };
}

export function parseAuditEvidenceLookupIdentifierDraft(
  raw: string | null,
): AuditEvidenceLookupIdentifierDraftV1 | null {
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuditEvidenceLookupIdentifierDraftV1>;

    if (parsed.schemaVersion !== 1) {
      return null;
    }

    return {
      schemaVersion: 1,
      assessmentId: typeof parsed.assessmentId === "string" ? parsed.assessmentId : "",
      snapshotId: typeof parsed.snapshotId === "string" ? parsed.snapshotId : "",
      controlId: typeof parsed.controlId === "string" ? parsed.controlId : "",
      updatedAtUtc:
        typeof parsed.updatedAtUtc === "string" && parsed.updatedAtUtc.length > 0
          ? parsed.updatedAtUtc
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readAuditEvidenceLookupIdentifierDraft(): AuditEvidenceLookupIdentifierDraftV1 | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY);

    return parseAuditEvidenceLookupIdentifierDraft(raw);
  } catch {
    return null;
  }
}

export function persistAuditEvidenceLookupIdentifierDraft(fields: AuditEvidenceLookupIdentifierFields): void {
  if (typeof window === "undefined") {
    return;
  }

  const next: AuditEvidenceLookupIdentifierDraftV1 = {
    schemaVersion: 1,
    assessmentId: fields.assessmentId,
    snapshotId: fields.snapshotId,
    controlId: fields.controlId,
    updatedAtUtc: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function clearAuditEvidenceLookupIdentifierDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUDIT_EVIDENCE_LOOKUP_IDENTIFIER_DRAFT_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function fieldsFromDraft(
  draft: AuditEvidenceLookupIdentifierDraftV1 | null,
): AuditEvidenceLookupIdentifierFields {
  if (draft === null) {
    return emptyDraft();
  }

  return {
    assessmentId: draft.assessmentId,
    snapshotId: draft.snapshotId,
    controlId: draft.controlId,
  };
}
