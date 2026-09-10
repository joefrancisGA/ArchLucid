import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { auditEvidenceLineageBlockedReason } from "@/lib/governance/audit-evidence-lineage-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet } from "@/lib/proxy-json-client";

export async function fetchAuditEvidenceControlLineage(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): Promise<AuditEvidenceLineageRecord> {
  try {
    return await proxyJsonGet<AuditEvidenceLineageRecord>(
      `/api/proxy/v1/infra-evidence/audit-assessments/${encodeURIComponent(assessmentId)}/snapshots/${encodeURIComponent(snapshotId)}/controls/${encodeURIComponent(controlId)}/lineage`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = auditEvidenceLineageBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
