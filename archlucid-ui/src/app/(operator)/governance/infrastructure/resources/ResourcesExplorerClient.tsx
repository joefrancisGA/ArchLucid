"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceWorkbenchBuildProvenanceStrip } from "@/components/infra-evidence/InfraEvidenceWorkbenchBuildProvenanceStrip";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  fetchCloudResourceExplorerPage,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { RESOURCES_EXPLORER_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-resources-explorer-page-shortcuts";
import {
  buildInfrastructureAskHref,
  buildResourceHubExplorerHref,
  buildResourceHubOverviewHref,
  parseResourceExplorerCloudResourceIdFromSearch,
  parseResourceExplorerNamePrefixFromSearch,
  parseResourceExplorerResourceGroupFromSearch,
  parseResourceExplorerResourceTypeFromSearch,
  resourceExplorerFilterHrefFromSearch,
  RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM,
  RESOURCE_EXPLORER_NAME_PREFIX_PARAM,
  RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM,
  RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM,
  RESOURCE_EXPLORER_SNAPSHOT_ID_PARAM,
  RESOURCE_EXPLORER_WORK_QUEUE_PARAM,
  parseResourceHubQueryValueFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM,
  parseInfraResourceRowArmIdDisclosureKeyFromSearch,
  writeInfraResourceRowArmIdDisclosureKeyToUrl,
} from "@/lib/infra-evidence/infra-resource-row-arm-id-disclosure-url";
import {
  formatAzureResourceTypeForDisplay,
  formatCloudResourceDisplayName,
} from "@/lib/infra-evidence/format-azure-resource-display";
import { formatInstantCompactMilitary } from "@/lib/locale-datetime";
import {
  formatResourceHubTabActionLabelFromExplorerWorkQueue,
  parseResourceExplorerWorkQueueFromSearch,
  resolveResourceHubTabFromExplorerWorkQueue,
  type CloudResourceExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { CloudResourceSummary, ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_REDIRECT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SCOPE_ALL_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SORT_PAGE_LOCAL_DISCLOSURE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_WORK_MARKERS_KEY_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  formatResourcesExplorerPageRangeLabel,
  parseResourceExplorerPageFromSearch,
  parseResourcesExplorerSortAscFromSearch,
  parseResourcesExplorerSortKeyFromSearch,
  RESOURCE_EXPLORER_PAGE_PARAM,
  RESOURCE_EXPLORER_SORT_DIR_PARAM,
  RESOURCE_EXPLORER_SORT_PARAM,
  resourceExplorerListStateHrefFromSearch,
} from "@/lib/infra-evidence/resources-explorer-url";

import {
  RESOURCES_EXPLORER_DEFAULT_SORT_ASC,
  RESOURCES_EXPLORER_DEFAULT_SORT_KEY,
  resourcesExplorerTableSortDirection,
  sortResourceExplorerRows,
  type ResourcesExplorerTableSortKey,
} from "@/lib/infra-evidence/resources-explorer-table-sort";

import { ResourcesExplorerBreadcrumb } from "./ResourcesExplorerBreadcrumb";
import { ResourcesExplorerClaimOrientationStrip } from "./ResourcesExplorerClaimOrientationStrip";
import { ResourcesExplorerCommandBar } from "./ResourcesExplorerCommandBar";
import { ResourcesExplorerSnapshotStrip } from "./ResourcesExplorerSnapshotStrip";
import { ResourcesExplorerSortHeaderCell } from "./ResourcesExplorerSortHeaderCell";
import { ResourcesExplorerWorkCountCell } from "./ResourcesExplorerWorkCountCell";

function resolveExplorerAskHubTab(
  workQueue: CloudResourceExplorerWorkQueue,
): ResourceHubTab | undefined {
  return resolveResourceHubTabFromExplorerWorkQueue(workQueue) ?? undefined;
}

function resolveNewestLastSeenUtc(rows: readonly CloudResourceSummary[]): string {
  let newest = "";

  for (const row of rows) {
    if (row.lastSeenUtc.length > 0 && row.lastSeenUtc.localeCompare(newest) > 0) {
      newest = row.lastSeenUtc;
    }
  }

  return newest;
}

export function ResourcesExplorerClient() {
  useProductionEvalChrome();
  const { productLine } = useProductLine();
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlNamePrefix = parseResourceExplorerNamePrefixFromSearch(
    searchParams.get(RESOURCE_EXPLORER_NAME_PREFIX_PARAM),
  );
  const urlResourceType = parseResourceExplorerResourceTypeFromSearch(
    searchParams.get(RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM),
  );
  const urlResourceGroup = parseResourceExplorerResourceGroupFromSearch(
    searchParams.get(RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM),
  );
  const urlCloudResourceId = parseResourceExplorerCloudResourceIdFromSearch(
    searchParams.get(RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlWorkQueue = parseResourceExplorerWorkQueueFromSearch(
    searchParams.get(RESOURCE_EXPLORER_WORK_QUEUE_PARAM),
  );
  const workQueueExplicitlySet = searchParams.has(RESOURCE_EXPLORER_WORK_QUEUE_PARAM);
  const urlSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_EXPLORER_SNAPSHOT_ID_PARAM),
  );
  const urlPage = parseResourceExplorerPageFromSearch(searchParams.get(RESOURCE_EXPLORER_PAGE_PARAM));
  const urlSortKey = parseResourcesExplorerSortKeyFromSearch(searchParams.get(RESOURCE_EXPLORER_SORT_PARAM));
  const urlSortAsc = parseResourcesExplorerSortAscFromSearch(searchParams.get(RESOURCE_EXPLORER_SORT_DIR_PARAM));
  const infraResourceRowArmIdKeyParam = searchParams.get(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM);
  const [infraResourceRowArmIdKey, setInfraResourceRowArmIdKeyState] = useState(() =>
    parseInfraResourceRowArmIdDisclosureKeyFromSearch(infraResourceRowArmIdKeyParam),
  );

  const syncInfraResourceRowArmIdKeyToUrl = useCallback((cloudResourceId: string | null) => {
    writeInfraResourceRowArmIdDisclosureKeyToUrl(cloudResourceId);
  }, []);

  const setInfraResourceRowArmIdKey = useCallback(
    (cloudResourceId: string | null) => {
      setInfraResourceRowArmIdKeyState(cloudResourceId ?? "");
      syncInfraResourceRowArmIdKeyToUrl(cloudResourceId);
    },
    [syncInfraResourceRowArmIdKeyToUrl],
  );

  useEffect(() => {
    setInfraResourceRowArmIdKeyState(parseInfraResourceRowArmIdDisclosureKeyFromSearch(infraResourceRowArmIdKeyParam));
  }, [infraResourceRowArmIdKeyParam]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && infraResourceRowArmIdKey.length > 0) {
        setInfraResourceRowArmIdKey(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [infraResourceRowArmIdKey.length, setInfraResourceRowArmIdKey]);

  const [namePrefix, setNamePrefix] = useState(urlNamePrefix);
  const [resourceType, setResourceType] = useState(urlResourceType);
  const [resourceGroup, setResourceGroup] = useState(urlResourceGroup);
  const [workQueue, setWorkQueue] = useState<CloudResourceExplorerWorkQueue>(urlWorkQueue);
  const [rows, setRows] = useState<CloudResourceSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(50);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);

  useEffect(() => {
    if (urlCloudResourceId.length === 0) {
      return;
    }

    router.replace(buildResourceHubExplorerHref(urlCloudResourceId, urlWorkQueue, urlSnapshotId));
  }, [router, urlCloudResourceId, urlSnapshotId, urlWorkQueue]);

  useEffect(() => {
    setNamePrefix(urlNamePrefix);
    setResourceType(urlResourceType);
    setResourceGroup(urlResourceGroup);
    setWorkQueue(urlWorkQueue);
    setPage(urlPage);
  }, [urlNamePrefix, urlPage, urlResourceGroup, urlResourceType, urlWorkQueue]);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchCloudResourceExplorerPage(
        {
          namePrefix: urlNamePrefix,
          resourceType: urlResourceType,
          resourceGroup: urlResourceGroup,
          workQueue: urlWorkQueue,
        },
        urlPage,
        50,
      );
      setRows(response.items);
      setTotalCount(response.totalCount);
      setPage(response.page);
      setPageSize(response.pageSize);
      setHasMore(response.hasMore);
    } catch (error: unknown) {
      setLoadError(formatInfraEvidenceHubApiError(error));
      setRows([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [urlNamePrefix, urlPage, urlResourceGroup, urlResourceType, urlWorkQueue]);

  useEffect(() => {
    if (urlCloudResourceId.length > 0) {
      return;
    }

    void loadResources();
  }, [loadResources, urlCloudResourceId]);

  useEffect(() => {
    if (urlCloudResourceId.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadSnapshots() {
      try {
        const response = await fetchInfraEvidenceSnapshots(1, 20);
        if (!cancelled) {
          setSnapshots(response.items);
        }
      } catch {
        if (!cancelled) {
          setSnapshots([]);
        }
      }
    }

    void loadSnapshots();

    return () => {
      cancelled = true;
    };
  }, [urlCloudResourceId]);

  const sortedRows = useMemo(
    () => sortResourceExplorerRows(rows, urlSortKey, urlSortAsc),
    [rows, urlSortAsc, urlSortKey],
  );

  const newestLastSeenUtc = useMemo(() => resolveNewestLastSeenUtc(rows), [rows]);

  const resolvedSnapshot = useMemo(() => {
    if (urlSnapshotId.length > 0) {
      return snapshots.find((snapshot) => snapshot.snapshotId === urlSnapshotId) ?? null;
    }

    return snapshots[0] ?? null;
  }, [snapshots, urlSnapshotId]);

  const replaceListState = useCallback(
    (patch: {
      readonly page?: number;
      readonly sortKey?: ResourcesExplorerTableSortKey;
      readonly sortAsc?: boolean;
    }) => {
      router.replace(resourceExplorerListStateHrefFromSearch(searchParams.toString(), patch, resourcesPath));
    },
    [resourcesPath, router, searchParams],
  );

  const onSort = (nextSortKey: ResourcesExplorerTableSortKey) => {
    if (urlSortKey === nextSortKey) {
      replaceListState({ sortKey: nextSortKey, sortAsc: !urlSortAsc });

      return;
    }

    replaceListState({ sortKey: nextSortKey, sortAsc: true });
  };

  const applyFilters = () => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), {
      namePrefix,
      resourceType,
      resourceGroup,
      workQueue,
    }, resourcesPath);
    router.replace(resourceExplorerListStateHrefFromSearch(nextHref.split("?")[1] ?? "", { page: 1 }, resourcesPath));
  };

  const clearFilters = () => {
    setNamePrefix("");
    setResourceType("");
    setResourceGroup("");
    setWorkQueue("all");
    router.replace(resourceExplorerListStateHrefFromSearch("", { page: 1 }, resourcesPath));
  };

  const applyWorkQueue = (nextWorkQueue: CloudResourceExplorerWorkQueue) => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), {
      workQueue: nextWorkQueue,
    }, resourcesPath);
    router.replace(resourceExplorerListStateHrefFromSearch(nextHref.split("?")[1] ?? "", { page: 1 }, resourcesPath));
  };

  const loadSavedView = (filters: {
    readonly namePrefix: string;
    readonly resourceType: string;
    readonly resourceGroup: string;
    readonly workQueue: CloudResourceExplorerWorkQueue;
    readonly sortKey?: ResourcesExplorerTableSortKey;
    readonly sortAsc?: boolean;
  }) => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), filters, resourcesPath);
    router.replace(
      resourceExplorerListStateHrefFromSearch(nextHref.split("?")[1] ?? "", {
        page: 1,
        sortKey: filters.sortKey ?? RESOURCES_EXPLORER_DEFAULT_SORT_KEY,
        sortAsc: filters.sortAsc ?? RESOURCES_EXPLORER_DEFAULT_SORT_ASC,
      }, resourcesPath),
    );
  };

  const goToPage = (nextPage: number) => {
    replaceListState({ page: nextPage });
  };

  if (urlCloudResourceId.length > 0) {
    return (
      <OperatorPageContainer
        variant="full"
        className="py-4"
        data-testid="infra-resource-explorer-workbench"
      >
        <OperatorPageHeader
          navHref={resourcesPath}
          title={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE}
          subtitle={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD}
          titleTestId="infra-resource-explorer-page-title"
        />
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {GOVERNANCE_INFRASTRUCTURE_RESOURCES_REDIRECT_LABEL}
        </p>
      </OperatorPageContainer>
    );
  }

  const scopedHubTabLabel = formatResourceHubTabActionLabelFromExplorerWorkQueue(urlWorkQueue);
  const appliedFilterCount = [urlNamePrefix, urlResourceType, urlResourceGroup].filter((value) => value.length > 0).length;
  const hasAppliedFilters = appliedFilterCount > 0 || workQueueExplicitlySet;
  const hasUnappliedFilterChanges =
    namePrefix !== urlNamePrefix
    || resourceType !== urlResourceType
    || resourceGroup !== urlResourceGroup
    || workQueue !== urlWorkQueue;
  const showPageLocalSortDisclosure = totalCount > pageSize || hasMore;

  const scopeStatusBadge = (
    <StatusTag
      kind={hasAppliedFilters ? "ready" : "neutral"}
      label={
        hasAppliedFilters
          ? `${appliedFilterCount + (workQueueExplicitlySet ? 1 : 0)} filter${appliedFilterCount + (workQueueExplicitlySet ? 1 : 0) === 1 ? "" : "s"} active`
          : GOVERNANCE_INFRASTRUCTURE_RESOURCES_SCOPE_ALL_LABEL
      }
      data-testid="infra-resource-explorer-scope-status"
    />
  );

  const pageRangeLabel = formatResourcesExplorerPageRangeLabel({ page, pageSize, totalCount });

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-resource-explorer-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={resourcesPath}
        title={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD}
        titleTestId="infra-resource-explorer-page-title"
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-resource-explorer-claim-discipline"
        metadata={
          <div className="flex flex-col gap-2">
            <ResourcesExplorerBreadcrumb />
            <ResourcesExplorerSnapshotStrip
              snapshot={resolvedSnapshot}
              snapshotPinned={urlSnapshotId.length > 0}
              newestLastSeenUtc={newestLastSeenUtc}
            />
          </div>
        }
        actions={
          <InfraEvidenceWorkbenchHeaderActions
            shortcutsTestId="infra-resource-explorer-page-shortcuts"
            shortcuts={RESOURCES_EXPLORER_PAGE_SHORTCUTS}
            scopeStatusBadge={scopeStatusBadge}
          />
        }
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID}
        className="flex w-full flex-col gap-4 scroll-mt-24"
        data-testid="infra-resource-explorer-primary-content"
      >
      <ResourcesExplorerCommandBar
        namePrefix={namePrefix}
        resourceType={resourceType}
        resourceGroup={resourceGroup}
        workQueue={workQueue}
        urlNamePrefix={urlNamePrefix}
        urlResourceType={urlResourceType}
        urlResourceGroup={urlResourceGroup}
        urlWorkQueue={urlWorkQueue}
        sortKey={urlSortKey}
        sortAsc={urlSortAsc}
        workQueueExplicitlySet={workQueueExplicitlySet}
        activeWorkQueueCount={totalCount}
        hasAppliedFilters={hasAppliedFilters}
        hasUnappliedFilterChanges={hasUnappliedFilterChanges}
        onNamePrefixChange={setNamePrefix}
        onResourceTypeChange={setResourceType}
        onResourceGroupChange={setResourceGroup}
        onApplyFilters={applyFilters}
        onClearFilters={clearFilters}
        onApplyWorkQueue={applyWorkQueue}
        onLoadSavedView={loadSavedView}
      />

      {loadError != null ? (
        <EnterpriseCompactEmptyState
          role="alert"
          title={GOVERNANCE_INFRASTRUCTURE_RESOURCES_LOAD_ERROR_TITLE}
          description={loadError}
          testId="infra-resource-explorer-load-error-panel"
          footer={
            <Button type="button" size="sm" variant="primary" onClick={() => void loadResources()}>
              Retry load
            </Button>
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag kind="neutral" label={pageRangeLabel} data-testid="infra-resource-explorer-page-range" />
          {showPageLocalSortDisclosure ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-resource-explorer-sort-page-local">
              {GOVERNANCE_INFRASTRUCTURE_RESOURCES_SORT_PAGE_LOCAL_DISCLOSURE}
            </span>
          ) : null}
        </div>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-resource-work-markers-key">
          {GOVERNANCE_INFRASTRUCTURE_RESOURCES_WORK_MARKERS_KEY_LABEL}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="infra-resource-explorer-page-previous"
          disabled={loading || page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          Previous page
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="infra-resource-explorer-page-next"
          disabled={loading || (!hasMore && page * pageSize >= totalCount)}
          onClick={() => goToPage(page + 1)}
        >
          Next page
        </Button>
      </div>

      <EnterpriseTable ariaLabel="Cloud resources">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <ResourcesExplorerSortHeaderCell
              label="Name"
              sortKey="name"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("name", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <ResourcesExplorerSortHeaderCell
              label="Work"
              sortKey="work"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("work", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <ResourcesExplorerSortHeaderCell
              label="Type"
              sortKey="type"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("type", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <ResourcesExplorerSortHeaderCell
              label="Resource group"
              sortKey="resourceGroup"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("resourceGroup", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <ResourcesExplorerSortHeaderCell
              label="Region"
              sortKey="region"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("region", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <ResourcesExplorerSortHeaderCell
              label="Last seen"
              sortKey="lastSeen"
              activeSortKey={urlSortKey}
              sortAsc={urlSortAsc}
              sortDirection={resourcesExplorerTableSortDirection("lastSeen", urlSortKey, urlSortAsc)}
              onSort={onSort}
            />
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {loading ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={7}>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading resources…
                </span>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {!loading && rows.length === 0 && loadError == null ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={7}>
                <EnterpriseCompactEmptyState
                  title="No matching resources"
                  description="Adjust filters or clear the work queue to widen the explorer results."
                  testId="infra-resource-explorer-empty-state"
                />
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {sortedRows.map((row) => {
            const isResourceIdDisclosed = infraResourceRowArmIdKey === row.cloudResourceId;
            const displayName = formatCloudResourceDisplayName(row);
            const disclosureId = `infra-resource-row-arm-id-disclosure-${row.cloudResourceId}`;

            return (
            <EnterpriseTableRow
              key={row.cloudResourceId}
              data-testid={`infra-resource-row-${row.cloudResourceId}`}
              selected={isResourceIdDisclosed}
            >
              <EnterpriseTableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="font-medium text-al-link hover:underline"
                      href={buildResourceHubExplorerHref(row.cloudResourceId, urlWorkQueue, urlSnapshotId)}
                      data-testid={`infra-resource-explorer-hub-${row.cloudResourceId}`}
                    >
                      {displayName}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-expanded={isResourceIdDisclosed}
                      aria-controls={disclosureId}
                      data-testid={`infra-resource-row-arm-id-toggle-${row.cloudResourceId}`}
                      aria-label={
                        isResourceIdDisclosed
                          ? `Hide resource id for ${displayName}`
                          : `Show resource id for ${displayName}`
                      }
                      onClick={() => setInfraResourceRowArmIdKey(isResourceIdDisclosed ? null : row.cloudResourceId)}
                    >
                      {isResourceIdDisclosed ? "Hide id" : "Show id"}
                    </Button>
                  </div>
                  {isResourceIdDisclosed ? (
                    <div
                      id={disclosureId}
                      className={cn("m-0 flex flex-wrap items-center gap-2 break-all font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`infra-resource-row-arm-id-disclosure-${row.cloudResourceId}`}
                    >
                      <span>resource id: {row.externalResourceId}</span>
                      <CopyIdButton value={row.externalResourceId} aria-label={`Copy resource id for ${displayName}`} />
                    </div>
                  ) : null}
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`infra-resource-work-counts-${row.cloudResourceId}`}>
                <ResourcesExplorerWorkCountCell
                  row={row}
                  workQueue={urlWorkQueue}
                  snapshotId={urlSnapshotId}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`infra-resource-type-${row.cloudResourceId}`}>
                {formatAzureResourceTypeForDisplay(row.resourceType)}
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.resourceGroup ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.region ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`infra-resource-last-seen-${row.cloudResourceId}`}>
                {row.lastSeenUtc.length > 0 ? formatInstantCompactMilitary(row.lastSeenUtc) : "—"}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap gap-2">
                  {urlWorkQueue !== "all" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildResourceHubOverviewHref(row.cloudResourceId, {
                          snapshotId: urlSnapshotId,
                          workQueue: urlWorkQueue,
                        })}
                        data-testid={`infra-resource-explorer-overview-${row.cloudResourceId}`}
                        aria-label={`Open overview for ${displayName}`}
                      >
                        Overview
                      </Link>
                    </Button>
                  ) : null}
                  {scopedHubTabLabel != null ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildResourceHubExplorerHref(row.cloudResourceId, urlWorkQueue, urlSnapshotId)}
                        data-testid={`infra-resource-explorer-hub-tab-${row.cloudResourceId}`}
                      >
                        {scopedHubTabLabel}
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildInfrastructureAskHref({
                        cloudResourceId: row.cloudResourceId,
                        workQueue: urlWorkQueue !== "all" ? urlWorkQueue : undefined,
                        snapshotId: urlSnapshotId.length > 0 ? urlSnapshotId : undefined,
                        hubTab: resolveExplorerAskHubTab(urlWorkQueue),
                      })}
                      data-testid={`infra-resource-explorer-ask-${row.cloudResourceId}`}
                      aria-label={`Ask about ${displayName}`}
                    >
                      Ask
                    </Link>
                  </Button>
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>

        <ResourcesExplorerClaimOrientationStrip />
        <InfraEvidenceWorkbenchBuildProvenanceStrip testId="infra-resource-explorer-build-provenance-limitation" />
      </main>
    </OperatorPageContainer>
  );
}
