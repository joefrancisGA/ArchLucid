"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ConnectionStatusEmptyPartialHonesty } from "@/components/integrations/ConnectionStatusEmptyPartialHonesty";
import { ConnectionStatusCategoryFilterEmptyPartialHonesty } from "@/components/integrations/ConnectionStatusCategoryFilterEmptyPartialHonesty";
import { CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/integrations/connection-status-category-filter-empty-not-load-failure-copy";
import { ConnectionStatusCategoryAndSubscriptionScopeFilterEmptyPartialHonesty } from "@/components/integrations/ConnectionStatusCategoryAndSubscriptionScopeFilterEmptyPartialHonesty";
import { ConnectionStatusDashboardPartialCaptureHonesty } from "@/components/integrations/ConnectionStatusDashboardPartialCaptureHonesty";
import { CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/integrations/connection-status-category-and-subscription-scope-filter-empty-not-load-failure-copy";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  IntegrationConnectorInventoryTable,
  IntegrationReadinessSummaryStrip,
  IntegrationRecommendedFirstSetupCard,
  type IntegrationConnectorInventoryRow,
} from "@/components/integrations/IntegrationReadinessSections";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { isEffectiveDevDefaultScope } from "@/lib/scope-switcher-display";
import { fetchTenantIntegrationsOperations } from "@/lib/api";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  CONNECTOR_PURPOSE_GROUPS,
  connectorCardTitle,
  formatConnectorCustomerSummary,
  formatIntegrationEventBusTechnicalDetails,
  groupConnectorsByPurpose,
  resolveConnectorDisplayStatus,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveConnectorPolicyLabel,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import {
  buildIntegrationReadinessSummaryTiles,
  buildIntegrationRecommendedFirstSetup,
  resolveIntegrationReadinessHeadline,
} from "@/lib/connector-readiness-summary";
import {
  connectorOperationsCategoryHrefFromSearch,
  parseConnectorOperationsCategoryFromSearch,
} from "@/lib/integrations/connector-operations-category-url";
import {
  isConnectorDisabledForDeployment,
  resolveConnectorDetailsLabel,
  resolveConnectorRowActionLabel,
  resolveIntegrationBackgroundDeliveryLabel,
} from "@/lib/integration-readiness-present";
import { isIntegrationConnectorExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { CONNECTOR_CONFIGURED_STATUS_HONESTY_LINE } from "@/lib/integrations/connector-configured-status-honesty-copy";
import { normalizeConnectorSurfaceStatus, type TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

const ADMINISTRATION_CONNECTION_STATUS_HARD_FAILURE_SURFACE_ID =
  "administration-connection-status-hard-failure" as const;

const CONNECTION_STATUS_EMPTY_STATE = {
  title: "No integrations to show yet",
  description:
    "This workspace returned no integration rows. Core review workflows still work without optional delivery channels.",
} as const;

export type ConnectorOperationsDashboardProps = {
  readonly hideRecommendedSetupActions?: boolean;
};

export function ConnectorOperationsDashboard(props: ConnectorOperationsDashboardProps = {}): ReactElement {
  const hideRecommendedSetupActions = props.hideRecommendedSetupActions === true;
  const { productLine } = useProductLine();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const activeCategory = parseConnectorOperationsCategoryFromSearch(searchParams.get("category"));
  const [data, setData] = useState<TenantIntegrationsOperationsDto | null>(null);
  const [configurationReadAt, setConfigurationReadAt] = useState<Date | null>(null);
  const [loadFailureMessage, setLoadFailureMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [workspaceScopeLabel] = useState(() => readActiveWorkspaceScopeLabel());
  const [workspaceSubscriptionScopePinned] = useState(() => {
    const record = readOperatorScopeFromStorage();

    if (record === null) {
      return false;
    }

    return !isEffectiveDevDefaultScope(record.workspaceId, record.projectId);
  });

  const latestRequestRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(false);

  const load = useCallback(async (): Promise<void> => {
    // Repeated retries can overlap, so only the newest read is allowed to write state.
    // Without this an earlier slow failure could land after a later success and replace
    // freshly loaded data with an error.
    const requestId: number = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const isCurrentRequest = (): boolean => mountedRef.current && latestRequestRef.current === requestId;

    setLoading(true);
    setLoadFailureMessage(null);

    try {
      const row = await fetchTenantIntegrationsOperations();

      if (!isCurrentRequest()) {
        return;
      }

      setData(row);
      setConfigurationReadAt(new Date());
    } catch (error: unknown) {
      if (!isCurrentRequest()) {
        return;
      }

      setData(null);
      setConfigurationReadAt(null);
      setLoadFailureMessage(
        error instanceof Error ? error.message : "Could not load connector operations summary.",
      );
    } finally {
      if (isCurrentRequest()) {
        setLoading(false);
        setRetrying(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const handleRetry = useCallback((): void => {
    setRetrying(true);
    void load();
  }, [load]);

  const visibleData: TenantIntegrationsOperationsDto | null = data === null
    ? null
    : {
      ...data,
      connectors: data.connectors
        .map((connector) => normalizeConnectorSurfaceStatus(connector))
        .filter((connector) => !isIntegrationConnectorExcludedForProductLine(connector.connectorKey, productLine)),
    };

  if (loading && data === null && loadFailureMessage === null) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading connection status.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (loadFailureMessage !== null) {
    return (
      <div className="space-y-3" data-testid="connection-status-load-failure">
        <OperatorSectionLoadFailure
          message={loadFailureMessage}
          retrying={retrying || loading}
          testId="connection-status-load-failure-alert"
          onRetry={handleRetry}
        />
        <FatalPageReportProblemSupportRow
          surfaceId={ADMINISTRATION_CONNECTION_STATUS_HARD_FAILURE_SURFACE_ID}
          errorTitle="Connection status could not load"
          errorCode="connection-status-load-failed"
          correlationId={null}
          httpStatus={null}
        />
      </div>
    );
  }

  if (visibleData === null || configurationReadAt === null) {
    return (
      <div className="space-y-3" data-testid="connection-status-load-failure">
        <OperatorSectionLoadFailure
          message="Connection status could not be loaded."
          retrying={retrying || loading}
          testId="connection-status-load-failure-alert"
          onRetry={handleRetry}
        />
        <FatalPageReportProblemSupportRow
          surfaceId={ADMINISTRATION_CONNECTION_STATUS_HARD_FAILURE_SURFACE_ID}
          errorTitle="Connection status could not load"
          errorCode="connection-status-load-failed"
          correlationId={null}
          httpStatus={null}
        />
      </div>
    );
  }

  if (visibleData.connectors.length === 0) {
    return (
      <EnterpriseCompactEmptyState
        title={CONNECTION_STATUS_EMPTY_STATE.title}
        description={CONNECTION_STATUS_EMPTY_STATE.description}
        testId="connection-status-empty-state"
        footer={<ConnectionStatusEmptyPartialHonesty />}
      />
    );
  }

  const groupedConnectors = groupConnectorsByPurpose(visibleData.connectors);
  const summaryTiles = buildIntegrationReadinessSummaryTiles(visibleData);
  const headline = resolveIntegrationReadinessHeadline(visibleData.connectors, visibleData.integrationEventBus);
  const recommendedFirstSetup = buildIntegrationRecommendedFirstSetup(visibleData);
  const eventBusHumanStatus = resolveIntegrationEventBusHumanStatus(visibleData.integrationEventBus);
  const eventBusBackgroundLabel = resolveIntegrationBackgroundDeliveryLabel(visibleData.integrationEventBus);
  const eventBusDisplayStatus =
    eventBusBackgroundLabel === "Configured"
      ? "Ready"
      : eventBusBackgroundLabel === "Not configured"
        ? "Needs attention"
        : "Optional";
  const inventoryPanelId = "connection-status-inventory-panels";
  const nonTechnicalGroups = CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical");
  const groupsInCategoryView =
    activeCategory === null
      ? nonTechnicalGroups
      : nonTechnicalGroups.filter((group) => group.id === activeCategory);
  const hasNonTechnicalInventory = groupsInCategoryView.some(
    (group) => (groupedConnectors.get(group.id) ?? []).length > 0,
  );
  const showsTechnicalInventory = activeCategory === null || activeCategory === "technical";
  const categoryFilterHidesAllRows =
    activeCategory !== null && !hasNonTechnicalInventory && !showsTechnicalInventory;

  const buildInventoryRow = (
    connectorKey: string,
    title: string,
    displayStatus: ReturnType<typeof resolveConnectorDisplayStatus>,
    guidance: string,
    configurationHref: string | null,
    technicalDetails: string,
    disabledForDeployment: boolean,
    policyLabel: ReturnType<typeof resolveConnectorPolicyLabel>,
    testId: string,
  ): IntegrationConnectorInventoryRow => ({
    key: connectorKey,
    title,
    policyLabel,
    displayStatus,
    guidance,
    configurationHref,
    rowActionLabel: resolveConnectorRowActionLabel(displayStatus, disabledForDeployment, configurationHref),
    detailsLabel: resolveConnectorDetailsLabel(displayStatus, disabledForDeployment),
    technicalDetails,
    disabledForDeployment,
    testId,
  });

  return (
    <div className="space-y-4">
      <ConnectionStatusDashboardPartialCaptureHonesty />
      <FilterChipGroup
        aria-label="Filter integrations by category"
        className="flex flex-wrap gap-2"
        data-testid="connection-status-category-chips"
      >
        <FilterChip
          href={connectorOperationsCategoryHrefFromSearch(currentSearch, null, pathname)}
          scroll={false}
          className={buyerFilterChipClass(activeCategory === null, false)}
          aria-current={activeCategory === null ? "page" : undefined}
          aria-controls={inventoryPanelId}
        >
          All categories
        </FilterChip>
        {CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical").map((group) => (
          <FilterChip
            key={group.id}
            href={connectorOperationsCategoryHrefFromSearch(currentSearch, group.id, pathname)}
            scroll={false}
            className={buyerFilterChipClass(activeCategory === group.id, false)}
            aria-current={activeCategory === group.id ? "page" : undefined}
            aria-controls={`integration-readiness-group-${group.id}`}
          >
            {group.title}
          </FilterChip>
        ))}
      </FilterChipGroup>
      {categoryFilterHidesAllRows ? (
        <EnterpriseCompactEmptyState
          testId="connection-status-category-filter-empty"
          title="No integrations in this category"
          description={CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
          actions={[
            {
              label: "Clear category filter",
              href: connectorOperationsCategoryHrefFromSearch(currentSearch, null, pathname),
              variant: "primary",
            },
          ]}
          footer={
            <div className="space-y-2">
              {workspaceSubscriptionScopePinned ? (
                <>
                  <p
                    className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="connection-status-category-and-subscription-scope-filter-empty"
                  >
                    {CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <ConnectionStatusCategoryAndSubscriptionScopeFilterEmptyPartialHonesty />
                </>
              ) : (
                <div className="space-y-2" data-testid="connection-status-category-only-filter-empty">
                  <p
                    className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="connection-status-category-filter-empty-not-load-failure"
                  >
                    {CONNECTION_STATUS_CATEGORY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <ConnectionStatusCategoryFilterEmptyPartialHonesty />
                </div>
              )}
            </div>
          }
        />
      ) : null}
      <IntegrationReadinessSummaryStrip
        headline={headline}
        tiles={summaryTiles}
        configurationReadAt={configurationReadAt}
        serverAsOfUtc={data?.asOfUtc ?? null}
        workspaceScopeLabel={workspaceScopeLabel}
        refreshing={loading || retrying}
        onRefresh={handleRetry}
      />
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="connection-status-configured-honesty"
      >
        {CONNECTOR_CONFIGURED_STATUS_HONESTY_LINE}
      </p>
      {recommendedFirstSetup && !hideRecommendedSetupActions ? (
        <IntegrationRecommendedFirstSetupCard setup={recommendedFirstSetup} />
      ) : null}

      {!categoryFilterHidesAllRows ? (
      <div id={inventoryPanelId} className="space-y-4">
      {CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical").map((group) => {
        if (activeCategory !== null && activeCategory !== group.id) {
          return null;
        }

        const connectors = groupedConnectors.get(group.id) ?? [];

        if (connectors.length === 0) {
          return null;
        }

        return (
          <section
            key={group.id}
            id={`integration-readiness-group-${group.id}`}
            className="space-y-4"
            data-testid={`integration-readiness-group-${group.id}`}
          >
            <div>
              <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {group.title}
              </h2>
              <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{group.description}</p>
            </div>
            <IntegrationConnectorInventoryTable
              ariaLabel={group.title}
              testId={`integration-readiness-table-${group.id}`}
              rows={connectors.map((connector) => {
                const humanStatus = resolveConnectorHumanStatus(connector);
                const displayStatus = resolveConnectorDisplayStatus(connector);
                const disabledForDeployment = isConnectorDisabledForDeployment(connector);

                return buildInventoryRow(
                  connector.connectorKey,
                  connectorCardTitle(connector, productLine),
                  displayStatus,
                  resolveConnectorGuidance(connector, humanStatus),
                  connector.configurationHref ?? null,
                  formatConnectorCustomerSummary(connector),
                  disabledForDeployment,
                  resolveConnectorPolicyLabel(connector.connectorKey),
                  `connector-card-${connector.connectorKey}`,
                );
              })}
            />
          </section>
        );
      })}

      {activeCategory === null || activeCategory === "technical" ? (
      <section
        id="integration-readiness-group-technical"
        className="space-y-4"
        data-testid="integration-readiness-group-technical"
      >
        <div>
          <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Advanced delivery infrastructure
          </h2>
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Background delivery for asynchronous integration events. Standard review workflows do not require this layer.
          </p>
        </div>
        <IntegrationConnectorInventoryTable
          ariaLabel="Advanced delivery infrastructure"
          testId="integration-readiness-table-technical"
          rows={[
            buildInventoryRow(
              "integration-event-bus",
              "Integration event bus",
              eventBusDisplayStatus,
              resolveIntegrationEventBusGuidance(visibleData.integrationEventBus, eventBusHumanStatus),
              null,
              formatIntegrationEventBusTechnicalDetails(visibleData.integrationEventBus),
              false,
              null,
              "connector-card-integration-event-bus",
            ),
          ]}
        />
      </section>
      ) : null}
      </div>
      ) : null}
    </div>
  );
}
