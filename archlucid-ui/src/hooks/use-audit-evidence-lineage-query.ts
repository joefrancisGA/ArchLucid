"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuditEvidenceControlLineage } from "@/lib/audit-evidence-lineage-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export const auditEvidenceLineageQueryKeys = {
  control: (assessmentId: string, snapshotId: string, controlId: string) =>
    ["audit-evidence-lineage", assessmentId, snapshotId, controlId] as const,
};

export function useAuditEvidenceLineageQuery(
  assessmentId: string | null,
  snapshotId: string | null,
  controlId: string | null,
) {
  const enabled =
    assessmentId !== null && assessmentId.length > 0
    && snapshotId !== null && snapshotId.length > 0
    && controlId !== null && controlId.length > 0;

  return useQuery({
    queryKey: enabled
      ? auditEvidenceLineageQueryKeys.control(assessmentId!, snapshotId!, controlId!)
      : ["audit-evidence-lineage", "disabled"],
    queryFn: () => fetchAuditEvidenceControlLineage(assessmentId!, snapshotId!, controlId!),
    enabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
