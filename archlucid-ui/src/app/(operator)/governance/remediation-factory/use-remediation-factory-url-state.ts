"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

import {
  parseRemediationFactoryFindingIdFromSearch,
  parseRemediationFactoryPathIdFromSearch,
  parseRemediationFactorySnapshotIdFromSearch,
  remediationFactorySelectionHrefFromSearch,
  REMEDIATION_FACTORY_FINDING_ID_PARAM,
  REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM,
  REMEDIATION_FACTORY_PATH_ID_PARAM,
  REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM,
} from "./remediation-factory-url-state";

export function useRemediationFactoryUrlState(productLine: ProductLineId) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navHref = remediationFactoryPathForProductLine(productLine);
  const resolvedPath = pathname ?? navHref;
  const searchString = searchParams.toString();

  const findingId = useMemo(
    () => parseRemediationFactoryFindingIdFromSearch(searchParams.get(REMEDIATION_FACTORY_FINDING_ID_PARAM)),
    [searchParams],
  );
  const pathId = useMemo(
    () => parseRemediationFactoryPathIdFromSearch(searchParams.get(REMEDIATION_FACTORY_PATH_ID_PARAM)),
    [searchParams],
  );
  const fromSnapshotId = useMemo(
    () => parseRemediationFactorySnapshotIdFromSearch(searchParams.get(REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM)),
    [searchParams],
  );
  const toSnapshotId = useMemo(
    () => parseRemediationFactorySnapshotIdFromSearch(searchParams.get(REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM)),
    [searchParams],
  );

  const hasSnapshotPair = fromSnapshotId !== null && toSnapshotId !== null;

  const syncSelection = useCallback(
    (patch: {
      readonly findingId?: string | null;
      readonly pathId?: string | null;
      readonly fromSnapshot?: string | null;
      readonly toSnapshot?: string | null;
    }) => {
      router.replace(remediationFactorySelectionHrefFromSearch(searchString, patch, resolvedPath), {
        scroll: false,
      });
    },
    [resolvedPath, router, searchString],
  );

  const selectFinding = useCallback(
    (nextFindingId: string) => {
      syncSelection({ findingId: nextFindingId, pathId: null });
    },
    [syncSelection],
  );

  const selectPath = useCallback(
    (nextPathId: string) => {
      syncSelection({ pathId: nextPathId, findingId: null });
    },
    [syncSelection],
  );

  const setSnapshotPair = useCallback(
    (pair: { readonly fromSnapshotId: string; readonly toSnapshotId: string }) => {
      syncSelection({
        fromSnapshot: pair.fromSnapshotId,
        toSnapshot: pair.toSnapshotId,
      });
    },
    [syncSelection],
  );

  return {
    findingId,
    pathId,
    fromSnapshotId,
    toSnapshotId,
    hasSnapshotPair,
    selectFinding,
    selectPath,
    setSnapshotPair,
    syncSelection,
  };
}
