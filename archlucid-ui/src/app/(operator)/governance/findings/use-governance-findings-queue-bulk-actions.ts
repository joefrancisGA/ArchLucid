"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  governanceAssignedToMeBulkSelectionHrefFromSearch,
  governanceFindingsBulkSelectionHrefFromSearch,
  parseGovernanceFindingsBulkSelectionFromSearch,
} from "@/lib/governance/governance-findings-bulk-selection-url";

export function useGovernanceFindingsQueueBulkActions(options: {
  readonly refresh: () => void;
  readonly mode?: "tenant" | "assigned-to-me";
}) {
  const { refresh, mode = "tenant" } = options;
  const router = useRouter();
  const pathname = usePathname() ?? (mode === "assigned-to-me" ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH);
  const searchParams = useSearchParams();
  const urlBulkFindingsRaw = searchParams.get("bulkFindings");
  const urlBulkFindingIds = parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw);
  const [selectedFindingIds, setSelectedFindingIdsState] = useState<ReadonlySet<string>>(
    () => new Set(urlBulkFindingIds),
  );

  const syncBulkSelectionToUrl = useCallback(
    (findingIds: ReadonlySet<string>) => {
      const href =
        mode === "assigned-to-me"
          ? governanceAssignedToMeBulkSelectionHrefFromSearch(searchParams.toString(), [...findingIds])
          : governanceFindingsBulkSelectionHrefFromSearch(searchParams.toString(), [...findingIds], pathname);

      router.replace(href, { scroll: false });
    },
    [mode, pathname, router, searchParams],
  );

  const onSelectionChange = useCallback(
    (findingIds: ReadonlySet<string>) => {
      setSelectedFindingIdsState(findingIds);
      syncBulkSelectionToUrl(findingIds);
    },
    [syncBulkSelectionToUrl],
  );

  useEffect(() => {
    setSelectedFindingIdsState(new Set(parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw)));
  }, [urlBulkFindingsRaw]);

  const onBulkApplied = useCallback(() => {
    onSelectionChange(new Set());
    refresh();
  }, [onSelectionChange, refresh]);

  return {
    selectedFindingIds,
    onSelectionChange,
    onBulkApplied,
  };
}
