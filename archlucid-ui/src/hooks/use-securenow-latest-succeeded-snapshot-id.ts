"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

const SNAPSHOT_PAGE_SIZE = 20;

export function useSecureNowLatestSucceededSnapshotId(): {
  readonly latestSnapshotId: string | null;
  readonly isPending: boolean;
  readonly isError: boolean;
} {
  const query = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });

  if (query.isPending) {
    return { latestSnapshotId: null, isPending: true, isError: false };
  }

  if (query.isError) {
    return { latestSnapshotId: null, isPending: false, isError: true };
  }

  const latestSnapshotId =
    (query.data?.items ?? []).find((row) => isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus))
      ?.snapshotId
      ?.trim()
    ?? null;

  const normalized = latestSnapshotId !== null && latestSnapshotId.length > 0 ? latestSnapshotId : null;

  return { latestSnapshotId: normalized, isPending: false, isError: false };
}
