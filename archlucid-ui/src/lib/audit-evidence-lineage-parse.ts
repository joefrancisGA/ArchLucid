import type {
  AuditEvidenceLineageLatestRemediationAttempt,
  AuditEvidenceLineageLatestRemediationAttemptStatus,
  AuditEvidenceLineageRecord,
  AuditEvidenceLineageVerifiedRemediationAssociation,
} from "@/lib/audit-evidence-lineage-types";

const LATEST_REMEDIATION_ATTEMPT_STATUSES: ReadonlySet<string> = new Set([
  "VerificationFailed",
  "ChangeImplemented",
  "Verified",
]);

function parseLatestRemediationAttemptStatus(
  raw: unknown,
): AuditEvidenceLineageLatestRemediationAttemptStatus | null {
  if (typeof raw !== "string") {
    return null;
  }

  if (!LATEST_REMEDIATION_ATTEMPT_STATUSES.has(raw)) {
    return null;
  }

  return raw as AuditEvidenceLineageLatestRemediationAttemptStatus;
}

export function parseAuditEvidenceLineageLatestRemediationAttempt(
  raw: unknown,
): AuditEvidenceLineageLatestRemediationAttempt | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const instanceId = typeof row.instanceId === "string" ? row.instanceId.trim() : "";
  const status = parseLatestRemediationAttemptStatus(row.status);

  if (instanceId.length === 0 || status === null) {
    return null;
  }

  return {
    instanceId,
    status,
    controlId: typeof row.controlId === "string" ? row.controlId : undefined,
    updatedUtc: typeof row.updatedUtc === "string" ? row.updatedUtc : undefined,
  };
}

export function resolveLatestRemediationAttemptForSpine(
  lineage: AuditEvidenceLineageRecord,
): AuditEvidenceLineageLatestRemediationAttempt | null {
  const attempt = lineage.latestRemediationAttempt ?? null;

  if (attempt === null) {
    return null;
  }

  const listedUnderVerified = (lineage.verifiedRemediationAssociations ?? []).some(
    (association) => association.instanceId === attempt.instanceId,
  );

  if (listedUnderVerified) {
    return null;
  }

  return attempt;
}

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
    latestRemediationAttempt: parseAuditEvidenceLineageLatestRemediationAttempt(
      raw.latestRemediationAttempt,
    ),
  };
}
