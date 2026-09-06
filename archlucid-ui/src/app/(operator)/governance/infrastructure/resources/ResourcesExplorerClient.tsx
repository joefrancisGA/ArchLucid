"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { InfrastructureResourcesSavedViewsBar } from "@/components/governance/infrastructure/InfrastructureResourcesSavedViewsBar";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { governanceInfrastructureResourceHubPath } from "@/lib/governance/governance-infrastructure-route-paths";
import {
  fetchCloudResourceExplorerPage,
  formatInfraEvidenceHubApiError,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
import {
  buildInfrastructureAskHref,
  buildResourceHubExplorerHref,
  buildResourceHubOverviewHref,
  buildResourceExplorerWorkCountHref,
  parseResourceExplorerCloudResourceIdFromSearch,
  parseResourceExplorerNamePrefixFromSearch,
  parseResourceExplorerResourceGroupFromSearch,
  parseResourceExplorerResourceTypeFromSearch,
  resourceExplorerFilterHrefFromSearch,
  RESOURCE_EXPLORER_CLOUD_RESOURCE_ID_PARAM,
  RESOURCE_EXPLORER_NAME_PREFIX_PARAM,
  RESOURCE_EXPLORER_RESOURCE_GROUP_PARAM,
  RESOURCE_EXPLORER_RESOURCE_TYPE_PARAM,
  RESOURCE_EXPLORER_WORK_QUEUE_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS,
  formatResourceHubTabActionLabelFromExplorerWorkQueue,
  parseResourceExplorerWorkQueueFromSearch,
  type CloudResourceExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { buildCloudResourceExplorerWorkCountBadges } from "@/lib/infra-evidence/infra-evidence-explorer-work-counts";
import type { CloudResourceSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function formatResourceLabel(row: CloudResourceSummary): string {
  if (row.displayName != null && row.displayName.trim().length > 0) {
    return row.displayName.trim();
  }

  const segments = row.externalResourceId.split("/");

  return segments[segments.length - 1] ?? row.externalResourceId;
}

export function ResourcesExplorerClient() {
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

  const [namePrefix, setNamePrefix] = useState(urlNamePrefix);
  const [resourceType, setResourceType] = useState(urlResourceType);
  const [resourceGroup, setResourceGroup] = useState(urlResourceGroup);
  const [workQueue, setWorkQueue] = useState<CloudResourceExplorerWorkQueue>(urlWorkQueue);
  const [rows, setRows] = useState<CloudResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (urlCloudResourceId.length === 0) {
      return;
    }

    router.replace(governanceInfrastructureResourceHubPath(urlCloudResourceId));
  }, [router, urlCloudResourceId]);

  useEffect(() => {
    setNamePrefix(urlNamePrefix);
    setResourceType(urlResourceType);
    setResourceGroup(urlResourceGroup);
    setWorkQueue(urlWorkQueue);
  }, [urlNamePrefix, urlResourceGroup, urlResourceType, urlWorkQueue]);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchCloudResourceExplorerPage({
        namePrefix: urlNamePrefix,
        resourceType: urlResourceType,
        resourceGroup: urlResourceGroup,
        workQueue: urlWorkQueue,
      });
      setRows(response.items);
    } catch (error: unknown) {
      setLoadError(formatInfraEvidenceHubApiError(error));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [urlNamePrefix, urlResourceGroup, urlResourceType, urlWorkQueue, urlCloudResourceId]);

  useEffect(() => {
    if (urlCloudResourceId.length > 0) {
      return;
    }

    void loadResources();
  }, [loadResources, urlCloudResourceId]);

  const applyFilters = () => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), {
      namePrefix,
      resourceType,
      resourceGroup,
      workQueue,
    });
    router.replace(nextHref);
  };

  const applyWorkQueue = (nextWorkQueue: CloudResourceExplorerWorkQueue) => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), {
      workQueue: nextWorkQueue,
    });
    router.replace(nextHref);
  };

  const loadSavedView = (filters: {
    readonly namePrefix: string;
    readonly resourceType: string;
    readonly resourceGroup: string;
    readonly workQueue: CloudResourceExplorerWorkQueue;
  }) => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), filters);
    router.replace(nextHref);
  };

  if (urlCloudResourceId.length > 0) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <LayerHeader pageKey="infrastructure-resources" />
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Opening resource evidence hub…
        </p>
      </div>
    );
  }

  const scopedHubTabLabel = formatResourceHubTabActionLabelFromExplorerWorkQueue(urlWorkQueue);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-resources" />

      <InfrastructureResourcesSavedViewsBar
        namePrefix={urlNamePrefix}
        resourceType={urlResourceType}
        resourceGroup={urlResourceGroup}
        workQueue={urlWorkQueue}
        onLoadView={loadSavedView}
      />

      <section className="grid gap-3 rounded border border-border bg-card p-4" aria-label="Resource explorer filters">
        <div className="flex flex-wrap gap-2" aria-label="Resource explorer work queues">
          {CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={urlWorkQueue === option.id ? "default" : "outline"}
              data-testid={`infra-resource-explorer-work-queue-${option.id}`}
              onClick={() => applyWorkQueue(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.find((option) => option.id === urlWorkQueue)?.summary}
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Name prefix</span>
            <input
              className="rounded border border-input bg-background px-3 py-2"
              data-testid="infra-resource-explorer-name-prefix"
              value={namePrefix}
              onChange={(event) => setNamePrefix(event.target.value)}
              placeholder="gateway"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Resource type</span>
            <input
              className="rounded border border-input bg-background px-3 py-2"
              data-testid="infra-resource-explorer-resource-type"
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              placeholder="Microsoft.Network/publicIPAddresses"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Resource group</span>
            <input
              className="rounded border border-input bg-background px-3 py-2"
              data-testid="infra-resource-explorer-resource-group"
              value={resourceGroup}
              onChange={(event) => setResourceGroup(event.target.value)}
              placeholder="rg-network"
            />
          </label>
        </div>
        <div>
          <Button type="button" size="sm" data-testid="infra-resource-explorer-apply" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </section>

      {loadError != null ? (
        <p className="m-0 text-sm text-destructive" role="alert">{loadError}</p>
      ) : null}

      <EnterpriseTable ariaLabel="Cloud resources">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Work</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Type</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Resource group</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Region</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last seen</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {loading ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={7}>Loading resources…</EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {!loading && rows.length === 0 ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={7}>No cloud resources match the current filters.</EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {rows.map((row) => {
            const workCountBadges = buildCloudResourceExplorerWorkCountBadges(row.workCounts);

            return (
            <EnterpriseTableRow key={row.cloudResourceId} data-testid={`infra-resource-row-${row.cloudResourceId}`}>
              <EnterpriseTableCell>
                <Link
                  className="font-medium text-al-link hover:underline"
                  href={buildResourceHubExplorerHref(row.cloudResourceId, urlWorkQueue)}
                  data-testid={`infra-resource-explorer-hub-${row.cloudResourceId}`}
                >
                  {formatResourceLabel(row)}
                </Link>
                <div className="truncate font-mono text-xs text-muted-foreground">{row.externalResourceId}</div>
              </EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`infra-resource-work-counts-${row.cloudResourceId}`}>
                {workCountBadges.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {workCountBadges.map((badge) => (
                      <Link
                        key={badge.kind}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-foreground hover:bg-muted/80"
                        title={badge.label}
                        href={buildResourceExplorerWorkCountHref(row.cloudResourceId, badge.kind, urlWorkQueue)}
                        data-testid={`infra-resource-work-count-${row.cloudResourceId}-${badge.kind}`}
                      >
                        {badge.kind === "findings" ? "F" : badge.kind === "remediation" ? "R" : "D"}:{badge.count}
                      </Link>
                    ))}
                  </div>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.resourceType ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.resourceGroup ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.region ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>
                {row.lastSeenUtc.length > 0 ? new Date(row.lastSeenUtc).toLocaleString() : "—"}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap gap-2">
                  {urlWorkQueue !== "all" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildResourceHubOverviewHref(row.cloudResourceId)}
                        data-testid={`infra-resource-explorer-overview-${row.cloudResourceId}`}
                      >
                        Overview
                      </Link>
                    </Button>
                  ) : null}
                  {scopedHubTabLabel != null ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildResourceHubExplorerHref(row.cloudResourceId, urlWorkQueue)}
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
                      })}
                      data-testid={`infra-resource-explorer-ask-${row.cloudResourceId}`}
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
    </div>
  );
}
