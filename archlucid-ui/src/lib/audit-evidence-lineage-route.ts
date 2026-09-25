export const AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH = "/governance/audit-evidence";

/** SecureNow Compliance shell — audit evidence lookup (same page, Compliance URL namespace). */
export const SECURENOW_AUDIT_EVIDENCE_PATH = "/compliance/audit-evidence" as const;

const AUDIT_EVIDENCE_CONTROL_LINEAGE_PATH_PATTERN =
  /^\/(?:governance|compliance)\/audit-evidence\/([^/]+)\/snapshots\/([^/]+)\/controls\/([^/?#]+)/;

export type ParsedAuditEvidenceControlLineagePath = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

export function buildAuditEvidenceControlLineagePath(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
  lookupPath: string = AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
): string {
  return `${lookupPath}/${assessmentId}/snapshots/${snapshotId}/controls/${controlId}`;
}

export function parseAuditEvidenceControlLineagePath(
  value: string,
): ParsedAuditEvidenceControlLineagePath | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  let pathname = trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const match = pathname.match(AUDIT_EVIDENCE_CONTROL_LINEAGE_PATH_PATTERN);

  if (match === null) {
    return null;
  }

  const assessmentId = match[1]?.trim() ?? "";
  const snapshotId = match[2]?.trim() ?? "";
  const controlId = match[3]?.trim() ?? "";

  if (assessmentId.length === 0 || snapshotId.length === 0 || controlId.length === 0) {
    return null;
  }

  return { assessmentId, snapshotId, controlId };
}

export function isAuditEvidenceControlLineagePath(pathname: string | null | undefined): boolean {
  const bare = barePathname(pathname);

  if (bare === null) {
    return false;
  }

  return AUDIT_EVIDENCE_CONTROL_LINEAGE_PATH_PATTERN.test(bare);
}

export function isAuditEvidenceRoutePath(pathname: string): boolean {
  const bare = pathname.split("?", 1)[0] ?? pathname;

  return (
    bare === AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH
    || bare.startsWith(`${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/`)
    || bare === SECURENOW_AUDIT_EVIDENCE_PATH
    || bare.startsWith(`${SECURENOW_AUDIT_EVIDENCE_PATH}/`)
  );
}

function barePathname(pathname: string | null | undefined): string | null {
  if (pathname === null || pathname === undefined) {
    return null;
  }

  return pathname.split("?", 1)[0] ?? pathname;
}

/** Lookup hub path for the active audit-evidence URL namespace (governance vs compliance). */
export function auditEvidenceLineageLookupPathFromPathname(pathname: string | null | undefined): string {
  const bare = barePathname(pathname);

  if (bare !== null && (bare === SECURENOW_AUDIT_EVIDENCE_PATH || bare.startsWith(`${SECURENOW_AUDIT_EVIDENCE_PATH}/`))) {
    return SECURENOW_AUDIT_EVIDENCE_PATH;
  }

  return AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH;
}
