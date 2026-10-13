import type {
  AuditEvidenceLineageRecord,
  AuditEvidenceLineageVerifiedRemediationAssociation,
} from "@/lib/audit-evidence-lineage-types";

export function parseAuditEvidenceLineageVerifiedRemediationAssociations(
  raw: unknown,
): AuditEvidenceLineageVerifiedRemediationAssociation[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;
    const instanceId = typeof row.instanceId === "string" ? row.instanceId.trim() : "";

    if (instanceId.length === 0) {
      return [];
    }

    return [{
      associationId: typeof row.associationId === "string" ? row.associationId : undefined,
      instanceId,
      status: typeof row.status === "string" ? row.status : undefined,
      verificationSnapshotId:
        typeof row.verificationSnapshotId === "string" ? row.verificationSnapshotId : undefined,
      controlId: typeof row.controlId === "string" ? row.controlId : undefined,
    }];
  });
}

export function normalizeAuditEvidenceLineageRecord(
  raw: AuditEvidenceLineageRecord,
): AuditEvidenceLineageRecord {
  return {
    ...raw,
    verifiedRemediationAssociations: parseAuditEvidenceLineageVerifiedRemediationAssociations(
      raw.verifiedRemediationAssociations,
    ),
  };
}
