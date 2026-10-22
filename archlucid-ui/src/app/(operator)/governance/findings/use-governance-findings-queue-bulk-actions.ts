"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  governanceFindingsQueueDeskHrefFromSearch,
  resolveGovernanceFindingsQueueDeskSelectionFromSearch,
  resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl,
} from "@/lib/governance/governance-findings-queue-desk-url";
import {
  governanceAssignedToMeBulkSelectionHrefFromSearch,
  governanceFindingsBulkSelectionHrefFromSearch,
  parseGovernanceFindingsBulkSelectionFromSearch,
} from "@/lib/governance/governance-findings-bulk-selection-url";
import {
  parseRemediationFactoryFindingIdFromSearch,
  REMEDIATION_FACTORY_FINDING_ID_PARAM,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-url-state";

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
  const searchString = searchParams.toString();
  const urlBulkFindingsRaw = searchParams.get("bulkFindings");
  const syncSecureNowPathInspectCursor = isSecureNowProductLine(productLine);
  const urlDeskSelection = resolveGovernanceFindingsQueueDeskSelectionFromSearch(
    searchString,
    availableFindingIds,
  );
  const [selectedFindingIds, setSelectedFindingIdsState] = useState<ReadonlySet<string>>(
    () => new Set(urlDeskSelection),
  );

  const syncBulkSelectionToUrl = useCallback(
    (findingIds: ReadonlySet<string>) => {
      const bulkFindingIds = [...findingIds];

      if (!syncSecureNowPathInspectCursor) {
        const href =
          mode === "assigned-to-me"
            ? governanceAssignedToMeBulkSelectionHrefFromSearch(searchString, bulkFindingIds)
            : governanceFindingsBulkSelectionHrefFromSearch(searchString, bulkFindingIds, pathname);

        router.replace(href, { scroll: false });

        return;
      }

      const pathInspectFindingId = resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl(bulkFindingIds);
      const href = governanceFindingsQueueDeskHrefFromSearch(searchString, pathname, {
        bulkFindingIds,
        pathInspectFindingId,
      });

      router.replace(href, { scroll: false });
    },
    [mode, pathname, router, searchString, syncSecureNowPathInspectCursor],
  );

  const onSelectionChange = useCallback(
    (findingIds: ReadonlySet<string>) => {
      setSelectedFindingIdsState(findingIds);
      syncBulkSelectionToUrl(findingIds);
    },
    [syncBulkSelectionToUrl],
  );

  useEffect(() => {
    const nextSelection = syncSecureNowPathInspectCursor
      ? resolveGovernanceFindingsQueueDeskSelectionFromSearch(searchString, availableFindingIds)
      : restrictBulkSelectionToAvailableFindings(
          parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw),
          availableFindingIds,
        );

    setSelectedFindingIdsState((currentSelection) =>
      areBulkSelectionsEqual(currentSelection, nextSelection) ? currentSelection : nextSelection,
    );
  }, [availableFindingIds, searchString, syncSecureNowPathInspectCursor, urlBulkFindingsRaw]);

  useEffect(() => {
    if (!syncSecureNowPathInspectCursor) {
      return;
    }

    const bulkIds = parseGovernanceFindingsBulkSelectionFromSearch(urlBulkFindingsRaw);

    if (bulkIds.length > 0) {
      return;
    }

    const urlFindingId = parseRemediationFactoryFindingIdFromSearch(
      searchParams.get(REMEDIATION_FACTORY_FINDING_ID_PARAM),
    );

    if (urlFindingId === null || !availableFindingIds.has(urlFindingId)) {
      return;
    }

    const href = governanceFindingsQueueDeskHrefFromSearch(searchString, pathname, {
      bulkFindingIds: [urlFindingId],
      pathInspectFindingId: urlFindingId,
    });

    router.replace(href, { scroll: false });
  }, [
    availableFindingIds,
    pathname,
    router,
    searchParams,
    searchString,
    syncSecureNowPathInspectCursor,
    urlBulkFindingsRaw,
  ]);

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
