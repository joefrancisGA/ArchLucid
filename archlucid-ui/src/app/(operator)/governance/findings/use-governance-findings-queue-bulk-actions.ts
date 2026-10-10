"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  governanceAssignedToMeBulkSelectionHrefFromSearch,
  governanceFindingsBulkSelectionHrefFromSearch,
  parseGovernanceFindingsBulkSelectionFromSearch,
} from "@/lib/governance/governance-findings-bulk-selection-url";

export function useGovernanceFindingsQueueBulkActions(options: {
  readonly refresh: () => void;
  readonly mode?: "tenant" | "assigned-to-me";
  readonly availableFindingIds: ReadonlySet<string>;
}) {
  const { refresh, mode = "tenant", availableFindingIds } = options;
  const router = useRouter();
  const { productLine } = useProductLine();
  const pathname = usePathname() ?? (
    mode === "assigned-to-me"
      ? assignedToMeFindingsPathForProductLine(productLine)
      : findingsPathForProductLine(productLine)
  );
  const searchParams = useSearchParams();
  const urlBulkFindingsRaw = searchParams.get("bulkFindings");
  const urlBulkFindingIds = restrictBulkSelectionToAvailableFindings(
    parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw),
    availableFindingIds,
  );
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
    const nextSelection = restrictBulkSelectionToAvailableFindings(
      parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw),
      availableFindingIds,
    );

    setSelectedFindingIdsState((currentSelection) =>
      areBulkSelectionsEqual(currentSelection, nextSelection) ? currentSelection : nextSelection,
    );
  }, [availableFindingIds, urlBulkFindingsRaw]);

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

function restrictBulkSelectionToAvailableFindings(
  findingIds: readonly string[],
  availableFindingIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(findingIds.filter((findingId) => availableFindingIds.has(findingId)));
}

function areBulkSelectionsEqual(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  return left.size === right.size && [...left].every((findingId) => right.has(findingId));
}
