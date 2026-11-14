"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

const SNAPSHOT_PAGE_SIZE = 20;

export function useSecureNowLatestSucceededSnapshotId(): {
  readonly latestSnapshotId: string | null;
  readonly succeededSnapshotCountOnFirstPage: number;
  readonly isPending: boolean;
  readonly isError: boolean;
} {
  const query = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });

  if (query.isPending) {
    return {
      latestSnapshotId: null,
      succeededSnapshotCountOnFirstPage: 0,
      isPending: true,
      isError: false,
    };
  }

  if (query.isError) {
    return {
      latestSnapshotId: null,
      succeededSnapshotCountOnFirstPage: 0,
      isPending: false,
      isError: true,
    };
  }

  const items = query.data?.items ?? [];
  const succeededSnapshotCountOnFirstPage = items.filter((row) =>
    isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus),
  ).length;

  const latestSnapshotId =
    items.find((row) => isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus))?.snapshotId?.trim() ?? null;

  const normalized = latestSnapshotId !== null && latestSnapshotId.length > 0 ? latestSnapshotId : null;

  return {
    latestSnapshotId: normalized,
    succeededSnapshotCountOnFirstPage,
    isPending: false,
    isError: false,
  };
}
