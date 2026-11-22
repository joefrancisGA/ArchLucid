"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

const SNAPSHOT_PAGE_SIZE = 20;

function firstSucceededSnapshotId(items: readonly InfraEvidenceSnapshotSummary[]): string | null {
  return items.find((row) =>
    isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus) && row.snapshotId?.trim(),
  )?.snapshotId.trim() ?? null;
}

export function useSecureNowLatestSucceededSnapshotId(): {
  readonly latestSnapshotId: string | null;
  readonly succeededSnapshotCountOnFirstPage: number;
  readonly isPending: boolean;
  readonly isError: boolean;
} {
  const scope = useOperatorScopeQueryKey();
  const query = useQuery({
    queryKey: [...operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE), "latest-succeeded", scope],
    queryFn: async ({ signal }) => {
      let pageNumber = 1;
      let page = await fetchInfraEvidenceSnapshots(pageNumber, SNAPSHOT_PAGE_SIZE);
      const succeededSnapshotCountOnFirstPage = (page.items ?? []).filter((row) =>
        isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus),
      ).length;
      let latestSnapshotId = firstSucceededSnapshotId(page.items ?? []);

      while (latestSnapshotId === null && page.hasMore) {
        signal.throwIfAborted();
        pageNumber += 1;
        page = await fetchInfraEvidenceSnapshots(pageNumber, SNAPSHOT_PAGE_SIZE);
        latestSnapshotId = firstSucceededSnapshotId(page.items ?? []);
      }

      return { latestSnapshotId, succeededSnapshotCountOnFirstPage };
    },
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

  return {
    latestSnapshotId: query.data?.latestSnapshotId ?? null,
    succeededSnapshotCountOnFirstPage: query.data?.succeededSnapshotCountOnFirstPage ?? 0,
    isPending: false,
    isError: false,
  };
}
