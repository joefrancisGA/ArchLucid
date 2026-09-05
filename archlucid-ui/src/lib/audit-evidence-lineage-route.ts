export const AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH = "/governance/audit-evidence";

export function buildAuditEvidenceControlLineagePath(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): string {
  return `${AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH}/${assessmentId}/snapshots/${snapshotId}/controls/${controlId}`;
}
