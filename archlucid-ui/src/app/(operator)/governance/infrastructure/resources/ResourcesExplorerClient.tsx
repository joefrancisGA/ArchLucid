"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { InfraEvidenceRecentScopeStrip } from "@/components/infra-evidence/InfraEvidenceRecentScopeStrip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { InfrastructureResourcesSavedViewsBar } from "@/components/governance/infrastructure/InfrastructureResourcesSavedViewsBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
  RESOURCE_EXPLORER_SNAPSHOT_ID_PARAM,
  RESOURCE_EXPLORER_WORK_QUEUE_PARAM,
  parseResourceHubQueryValueFromSearch,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM,
  infraResourceRowArmIdDisclosureHrefFromSearch,
  parseInfraResourceRowArmIdDisclosureKeyFromSearch,
} from "@/lib/infra-evidence/infra-resource-row-arm-id-disclosure-url";
import { formatInfraEvidenceRecentScopeLabel } from "@/lib/infra-evidence/infra-evidence-recent-scope-label";
import { recordInfraEvidenceRecentScope } from "@/lib/infra-evidence/infra-evidence-recent-scope";
import {
  CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS,
  formatCloudResourceExplorerWorkQueueLabel,
  formatResourceHubTabActionLabelFromExplorerWorkQueue,
  parseResourceExplorerWorkQueueFromSearch,
  resolveResourceHubTabFromExplorerWorkQueue,
  type CloudResourceExplorerWorkQueue,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { buildCloudResourceExplorerWorkCountBadges } from "@/lib/infra-evidence/infra-evidence-explorer-work-counts";
import type { CloudResourceSummary, ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_REDIRECT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_HELPER,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { ResourcesExplorerBreadcrumb } from "./ResourcesExplorerBreadcrumb";
import { ResourcesExplorerClaimOrientationStrip } from "./ResourcesExplorerClaimOrientationStrip";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

function formatResourceLabel(row: CloudResourceSummary): string {
  if (row.displayName != null && row.displayName.trim().length > 0) {
    return row.displayName.trim();
  }

  const segments = row.externalResourceId.split("/");

  return segments[segments.length - 1] ?? row.externalResourceId;
}

function resolveExplorerAskHubTab(
  workQueue: CloudResourceExplorerWorkQueue,
): ResourceHubTab | undefined {
  return resolveResourceHubTabFromExplorerWorkQueue(workQueue) ?? undefined;
}

export function ResourcesExplorerClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const router = useRouter();
  const pathname = usePathname() ?? "";
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
  const urlSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_EXPLORER_SNAPSHOT_ID_PARAM),
  );
  const infraResourceRowArmIdKeyParam = searchParams.get(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM);
  const [infraResourceRowArmIdKey, setInfraResourceRowArmIdKeyState] = useState(() =>
    parseInfraResourceRowArmIdDisclosureKeyFromSearch(infraResourceRowArmIdKeyParam),
  );

  const syncInfraResourceRowArmIdKeyToUrl = useCallback(
    (cloudResourceId: string | null) => {
      router.replace(
        infraResourceRowArmIdDisclosureHrefFromSearch(searchParams.toString(), cloudResourceId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

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

  const [namePrefix, setNamePrefix] = useState(urlNamePrefix);
  const [resourceType, setResourceType] = useState(urlResourceType);
  const [resourceGroup, setResourceGroup] = useState(urlResourceGroup);
  const [snapshotId, setSnapshotId] = useState(urlSnapshotId);
  const [workQueue, setWorkQueue] = useState<CloudResourceExplorerWorkQueue>(urlWorkQueue);
  const [rows, setRows] = useState<CloudResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setSnapshotId(urlSnapshotId);
    setWorkQueue(urlWorkQueue);
  }, [urlNamePrefix, urlResourceGroup, urlResourceType, urlSnapshotId, urlWorkQueue]);

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

  useEffect(() => {
    if (urlCloudResourceId.length > 0) {
      return;
    }

    const href = searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    const recentScopeLabel = formatInfraEvidenceRecentScopeLabel({
      surface: "explorer",
      workQueueLabel: formatCloudResourceExplorerWorkQueueLabel(urlWorkQueue),
      namePrefix: urlNamePrefix,
      resourceType: urlResourceType,
      resourceGroup: urlResourceGroup,
      snapshotId: urlSnapshotId,
    });

    if (recentScopeLabel == null) {
      return;
    }

    recordInfraEvidenceRecentScope({
      label: recentScopeLabel,
      href,
    });
  }, [
    pathname,
    searchParams,
    urlCloudResourceId,
    urlNamePrefix,
    urlResourceGroup,
    urlResourceType,
    urlSnapshotId,
    urlWorkQueue,
  ]);

  const applyFilters = () => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), {
      namePrefix,
      resourceType,
      resourceGroup,
      workQueue,
      snapshotId,
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
    readonly snapshotId?: string;
  }) => {
    const nextHref = resourceExplorerFilterHrefFromSearch(searchParams.toString(), filters);
    router.replace(nextHref);
  };

  if (urlCloudResourceId.length > 0) {
    return (
      <OperatorPageContainer
        variant="full"
        className="py-4"
        data-testid="infra-resource-explorer-workbench"
      >
        <OperatorPageHeader
          navHref={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}
          title={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE}
          subtitle={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD}
          titleTestId="infra-resource-explorer-page-title"
        />
        {!buyerPolishedShell ? <LayerHeader pageKey="infrastructure-resources" /> : null}
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {GOVERNANCE_INFRASTRUCTURE_RESOURCES_REDIRECT_LABEL}
        </p>
      </OperatorPageContainer>
    );
  }

  const scopedHubTabLabel = formatResourceHubTabActionLabelFromExplorerWorkQueue(urlWorkQueue);

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-resource-explorer-workbench"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-resource-explorer-claim-discipline"
        titleTestId="infra-resource-explorer-page-title"
        breadcrumb={buyerPolishedShell ? <ResourcesExplorerBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
          </div>
        }
      />

      {!buyerPolishedShell ? <LayerHeader pageKey="infrastructure-resources" /> : null}

      <main
        id={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID : undefined}
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col gap-4",
          buyerPolishedShell ? "scroll-mt-24" : undefined,
        )}
        data-testid="infra-resource-explorer-primary-content"
      >
      <InfraEvidenceRecentScopeStrip testId="infra-resource-explorer-recent-scope-strip" />

      <InfrastructureResourcesSavedViewsBar
        namePrefix={urlNamePrefix}
        resourceType={urlResourceType}
        resourceGroup={urlResourceGroup}
        workQueue={urlWorkQueue}
        onLoadView={loadSavedView}
      />

      <section className={cn("grid gap-3", cnCard)} aria-label="Resource explorer filters">
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
        <div className="grid gap-3 md:grid-cols-4">
          {buyerPolishedShell ? (
            <>
              <div className="grid gap-2 text-sm">
                <Label htmlFor="infra-resource-explorer-name-prefix">{GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL}</Label>
                <Input
                  id="infra-resource-explorer-name-prefix"
                  data-testid="infra-resource-explorer-name-prefix"
                  value={namePrefix}
                  onChange={(event) => setNamePrefix(event.target.value)}
                  placeholder="gateway"
                />
              </div>
              <div className="grid gap-2 text-sm">
                <Label htmlFor="infra-resource-explorer-resource-type">{GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL}</Label>
                <Input
                  id="infra-resource-explorer-resource-type"
                  data-testid="infra-resource-explorer-resource-type"
                  value={resourceType}
                  onChange={(event) => setResourceType(event.target.value)}
                  placeholder="Microsoft.Network/publicIPAddresses"
                />
              </div>
              <div className="grid gap-2 text-sm">
                <Label htmlFor="infra-resource-explorer-resource-group">{GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL}</Label>
                <Input
                  id="infra-resource-explorer-resource-group"
                  data-testid="infra-resource-explorer-resource-group"
                  value={resourceGroup}
                  onChange={(event) => setResourceGroup(event.target.value)}
                  placeholder="rg-network"
                />
              </div>
              <div className="grid gap-2 text-sm">
                <Label htmlFor="infra-resource-explorer-snapshot-id">{GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_LABEL}</Label>
                <p className={cn("m-0 text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_HELPER}
                </p>
                <Input
                  id="infra-resource-explorer-snapshot-id"
                  className="font-mono text-xs"
                  data-testid="infra-resource-explorer-snapshot-id"
                  value={snapshotId}
                  onChange={(event) => setSnapshotId(event.target.value)}
                  placeholder="22222222-2222-2222-2222-222222222222"
                />
              </div>
            </>
          ) : (
            <>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Name prefix</span>
                <input
                  className={cnField}
                  data-testid="infra-resource-explorer-name-prefix"
                  value={namePrefix}
                  onChange={(event) => setNamePrefix(event.target.value)}
                  placeholder="gateway"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Resource type</span>
                <input
                  className={cnField}
                  data-testid="infra-resource-explorer-resource-type"
                  value={resourceType}
                  onChange={(event) => setResourceType(event.target.value)}
                  placeholder="Microsoft.Network/publicIPAddresses"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Resource group</span>
                <input
                  className={cnField}
                  data-testid="infra-resource-explorer-resource-group"
                  value={resourceGroup}
                  onChange={(event) => setResourceGroup(event.target.value)}
                  placeholder="rg-network"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Snapshot context (links only)</span>
                <span className="text-xs text-al-text-secondary">
                  Preserves snapshot scope on hub and workbench links. The resource list is not filtered by snapshot.
                </span>
                <input
                  className={cn("font-mono text-xs", cnField)}
                  data-testid="infra-resource-explorer-snapshot-id"
                  value={snapshotId}
                  onChange={(event) => setSnapshotId(event.target.value)}
                  placeholder="22222222-2222-2222-2222-222222222222"
                />
              </label>
            </>
          )}
        </div>
        <div>
          <Button type="button" size="sm" data-testid="infra-resource-explorer-apply" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </section>

      {loadError != null ? (
        buyerPolishedShell ? (
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
        ) : (
          <p className="m-0 text-sm text-destructive" role="alert">{loadError}</p>
        )
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
                  href={buildResourceHubExplorerHref(row.cloudResourceId, urlWorkQueue, urlSnapshotId)}
                  data-testid={`infra-resource-explorer-hub-${row.cloudResourceId}`}
                >
                  {formatResourceLabel(row)}
                </Link>
                {buyerPolishedShell ? (
                  <CollapsibleSection
                    title="Resource id"
                    sectionTestId={`infra-resource-row-arm-id-disclosure-${row.cloudResourceId}`}
                    summaryLine="External ARM resource path"
                    open={infraResourceRowArmIdKey === row.cloudResourceId}
                    onToggle={(open) => setInfraResourceRowArmIdKey(open ? row.cloudResourceId : null)}
                  >
                    <p className={cn("m-0 truncate font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {row.externalResourceId}
                    </p>
                  </CollapsibleSection>
                ) : (
                  <div className="truncate font-mono text-xs text-al-text-secondary">{row.externalResourceId}</div>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`infra-resource-work-counts-${row.cloudResourceId}`}>
                {workCountBadges.length === 0 ? (
                  <span className="text-sm text-al-text-secondary">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {workCountBadges.map((badge) => (
                      <Link
                        key={badge.kind}
                        className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-900 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                        title={badge.label}
                        href={buildResourceExplorerWorkCountHref(row.cloudResourceId, badge.kind, urlWorkQueue, urlSnapshotId)}
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
                        href={buildResourceHubOverviewHref(row.cloudResourceId, {
                          snapshotId: urlSnapshotId,
                          workQueue: urlWorkQueue,
                        })}
                        data-testid={`infra-resource-explorer-overview-${row.cloudResourceId}`}
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

        {buyerPolishedShell ? <ResourcesExplorerClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}
