import type { AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";

async function proxyJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api/proxy/${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchAuditEvidenceControlLineage(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): Promise<AuditEvidenceLineageRecord> {
  return proxyJson<AuditEvidenceLineageRecord>(
    `v1/infra-evidence/audit-assessments/${assessmentId}/snapshots/${snapshotId}/controls/${controlId}/lineage`,
  );
}
