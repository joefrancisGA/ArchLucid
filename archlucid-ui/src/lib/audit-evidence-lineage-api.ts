import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import { proxyJsonGet } from "@/lib/proxy-json-client";

export async function fetchAuditEvidenceControlLineage(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): Promise<AuditEvidenceLineageRecord> {
  return proxyJsonGet<AuditEvidenceLineageRecord>(
    `/api/proxy/v1/infra-evidence/audit-assessments/${encodeURIComponent(assessmentId)}/snapshots/${encodeURIComponent(snapshotId)}/controls/${encodeURIComponent(controlId)}/lineage`,
  );
}
