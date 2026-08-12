"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  IntegrationConnectorInventoryTable,
  IntegrationReadinessSummaryStrip,
  IntegrationRecommendedFirstSetupCard,
  type IntegrationConnectorInventoryRow,
} from "@/components/integrations/IntegrationReadinessSections";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { fetchTenantIntegrationsOperations } from "@/lib/api";
import {
  CONNECTOR_PURPOSE_GROUPS,
  connectorCardTitle,
  formatConnectorCustomerSummary,
  formatIntegrationEventBusTechnicalDetails,
  groupConnectorsByPurpose,
  resolveConnectorDisplayStatus,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import {
  buildIntegrationReadinessSummaryTiles,
  buildIntegrationRecommendedFirstSetup,
  resolveIntegrationReadinessHeadline,
} from "@/lib/connector-readiness-summary";
import {
  isConnectorDisabledForDeployment,
  resolveConnectorDetailsLabel,
  resolveConnectorRowActionLabel,
  resolveIntegrationBackgroundDeliveryLabel,
} from "@/lib/integration-readiness-present";
import type { TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

const CONNECTION_STATUS_EMPTY_STATE = {
  title: "No integrations to show yet",
  description:
    "This workspace returned no integration rows. Core review workflows still work without optional delivery channels.",
} as const;

export function ConnectorOperationsDashboard(): ReactElement {
  const [data, setData] = useState<TenantIntegrationsOperationsDto | null>(null);
  const [configurationReadAt, setConfigurationReadAt] = useState<Date | null>(null);
  const [loadFailureMessage, setLoadFailureMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

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

  if (loading && data === null && loadFailureMessage === null) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading connection status.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (loadFailureMessage !== null) {
    return (
      <OperatorSectionLoadFailure
        message={loadFailureMessage}
        retrying={retrying || loading}
        testId="connection-status-load-failure"
        onRetry={handleRetry}
      />
    );
  }

  if (data === null || configurationReadAt === null) {
    return (
      <OperatorSectionLoadFailure
        message="Connection status could not be loaded."
        retrying={retrying || loading}
        testId="connection-status-load-failure"
        onRetry={handleRetry}
      />
    );
  }

  if (data.connectors.length === 0) {
    return (
      <EnterpriseCompactEmptyState
        title={CONNECTION_STATUS_EMPTY_STATE.title}
        description={CONNECTION_STATUS_EMPTY_STATE.description}
        testId="connection-status-empty-state"
      />
    );
  }

  const groupedConnectors = groupConnectorsByPurpose(data.connectors);
  const summaryTiles = buildIntegrationReadinessSummaryTiles(data);
  const headline = resolveIntegrationReadinessHeadline(data.connectors, data.integrationEventBus);
  const recommendedFirstSetup = buildIntegrationRecommendedFirstSetup(data);
  const eventBusHumanStatus = resolveIntegrationEventBusHumanStatus(data.integrationEventBus);
  const eventBusBackgroundLabel = resolveIntegrationBackgroundDeliveryLabel(data.integrationEventBus);
  const eventBusDisplayStatus =
    eventBusBackgroundLabel === "Configured"
      ? "Ready"
      : eventBusBackgroundLabel === "Not configured"
        ? "Needs attention"
        : "Optional";

  const buildInventoryRow = (
    connectorKey: string,
    title: string,
    displayStatus: ReturnType<typeof resolveConnectorDisplayStatus>,
    guidance: string,
    configurationHref: string | null,
    technicalDetails: string,
    disabledForDeployment: boolean,
    testId: string,
  ): IntegrationConnectorInventoryRow => ({
    key: connectorKey,
    title,
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
      <IntegrationReadinessSummaryStrip
        headline={headline}
        tiles={summaryTiles}
        configurationReadAt={configurationReadAt}
      />
      {recommendedFirstSetup ? <IntegrationRecommendedFirstSetupCard setup={recommendedFirstSetup} /> : null}

      {CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical").map((group) => {
        const connectors = groupedConnectors.get(group.id) ?? [];

        if (connectors.length === 0) {
          return null;
        }

        return (
          <section key={group.id} className="space-y-4" data-testid={`integration-readiness-group-${group.id}`}>
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
                  connectorCardTitle(connector),
                  displayStatus,
                  resolveConnectorGuidance(connector, humanStatus),
                  connector.configurationHref ?? null,
                  formatConnectorCustomerSummary(connector),
                  disabledForDeployment,
                  `connector-card-${connector.connectorKey}`,
                );
              })}
            />
          </section>
        );
      })}

      <section className="space-y-4" data-testid="integration-readiness-group-technical">
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
              resolveIntegrationEventBusGuidance(data.integrationEventBus, eventBusHumanStatus),
              null,
              formatIntegrationEventBusTechnicalDetails(data.integrationEventBus),
              false,
              "connector-card-integration-event-bus",
            ),
          ]}
        />
      </section>
    </div>
  );
}
