export const AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH = "/governance/audit-evidence";

const AUDIT_EVIDENCE_CONTROL_LINEAGE_PATH_PATTERN =
  /^\/governance\/audit-evidence\/([^/]+)\/snapshots\/([^/]+)\/controls\/([^/?#]+)/;

export type ParsedAuditEvidenceControlLineagePath = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

export function buildAuditEvidenceControlLineagePath(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): string {
  return `${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/${assessmentId}/snapshots/${snapshotId}/controls/${controlId}`;
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

export function isAuditEvidenceRoutePath(pathname: string): boolean {
  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH || bare.startsWith(`${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/`);
}
