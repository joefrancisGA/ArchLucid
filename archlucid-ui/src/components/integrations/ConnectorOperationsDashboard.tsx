"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState, type ReactElement } from "react";

import {
  ConnectorReadinessCard,
  IntegrationReadinessSummaryStrip,
  IntegrationRecommendedNextStepsStrip,
} from "@/components/integrations/IntegrationReadinessSections";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { fetchTenantIntegrationsOperations } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  CONNECTOR_PURPOSE_GROUPS,
  connectorCardTitle,
  formatIntegrationEventBusTechnicalDetails,
  groupConnectorsByPurpose,
  resolveConnectorBestFor,
  resolveConnectorDisplayStatus,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusDisplayStatus,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import {
  buildIntegrationReadinessSummaryTiles,
  buildIntegrationRecommendedNextSteps,
  resolveIntegrationReadinessHeadline,
} from "@/lib/connector-readiness-summary";
import type { TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

export function ConnectorOperationsDashboard(): ReactElement {
  const [data, setData] = useState<TenantIntegrationsOperationsDto | null>(null);
  const [problem, setProblem] = useState<{ problem?: ApiProblemDetails; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setProblem(null);

      try {
        const row = await fetchTenantIntegrationsOperations();

        if (!cancelled) {
          setData(row);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setProblem({ message: e instanceof Error ? e.message : "Could not load connector operations summary." });
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading integration readiness.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (problem !== null) {
    return <OperatorApiProblem problem={problem.problem} fallbackMessage={problem.message} variant="warning" />;
  }

  if (!data) {
    return <></>;
  }

  const groupedConnectors = groupConnectorsByPurpose(data.connectors);
  const summaryTiles = buildIntegrationReadinessSummaryTiles(data);
  const headline = resolveIntegrationReadinessHeadline(data.connectors, data.integrationEventBus);
  const nextSteps = buildIntegrationRecommendedNextSteps(data);
  const eventBusHumanStatus = resolveIntegrationEventBusHumanStatus(data.integrationEventBus);
  const eventBusDisplayStatus = resolveIntegrationEventBusDisplayStatus(data.integrationEventBus);

  return (
    <div className="space-y-8">
      <IntegrationReadinessSummaryStrip headline={headline} tiles={summaryTiles} />
      <IntegrationRecommendedNextStepsStrip steps={nextSteps} />

      {CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical").map((group) => {
        const connectors = groupedConnectors.get(group.id) ?? [];

        if (connectors.length === 0) {
          return null;
        }

        return (
          <section key={group.id} data-testid={`integration-readiness-group-${group.id}`}>
            <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {group.title}
            </h2>
            <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{group.description}</p>
            <ul className="mt-4 grid list-none gap-4 p-0 md:grid-cols-2">
              {connectors.map((connector) => {
                const humanStatus = resolveConnectorHumanStatus(connector);

                return (
                  <ConnectorReadinessCard
                    key={connector.connectorKey}
                    title={connectorCardTitle(connector)}
                    displayStatus={resolveConnectorDisplayStatus(connector)}
                    guidance={resolveConnectorGuidance(connector, humanStatus)}
                    bestFor={resolveConnectorBestFor(connector.connectorKey)}
                    configurationHref={connector.configurationHref ?? null}
                    technicalDetails={connector.summary}
                    testId={`connector-card-${connector.connectorKey}`}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}

      <section data-testid="integration-readiness-group-technical">
        <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Advanced delivery infrastructure
        </h2>
        <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Background delivery for asynchronous integration events. Standard review workflows do not require this layer.
        </p>
        <ul className="mt-4 grid list-none gap-4 p-0 md:grid-cols-2">
          <ConnectorReadinessCard
            title="Integration event bus"
            displayStatus={eventBusDisplayStatus}
            guidance={resolveIntegrationEventBusGuidance(data.integrationEventBus, eventBusHumanStatus)}
            bestFor="Use when integration events must be delivered asynchronously across services."
            configurationHref={null}
            technicalDetails={formatIntegrationEventBusTechnicalDetails(data.integrationEventBus)}
            testId="connector-card-integration-event-bus"
          />
        </ul>
      </section>
    </div>
  );
}
