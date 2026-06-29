"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Badge } from "@/components/ui/badge";
import { fetchTenantIntegrationsOperations } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  CONNECTOR_PURPOSE_GROUPS,
  connectorCardTitle,
  formatConnectorStatusLabel,
  formatIntegrationEventBusTechnicalDetails,
  groupConnectorsByPurpose,
  humanStatusBadgeClass,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import type { ConnectorSurfaceStatusDto, TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

function ConnectorReadinessCard(props: { readonly connector: ConnectorSurfaceStatusDto }): ReactElement {
  const { connector } = props;
  const humanStatus = resolveConnectorHumanStatus(connector);
  const statusLabel = formatConnectorStatusLabel(connector, humanStatus);
  const guidance = resolveConnectorGuidance(connector, humanStatus);

  return (
    <li
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid={`connector-card-${connector.connectorKey}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{connectorCardTitle(connector)}</strong>
        <Badge variant="outline" className={cn(OPERATOR_TYPOGRAPHY.helper, humanStatusBadgeClass(humanStatus))}>
          {statusLabel}
        </Badge>
      </div>
      <p className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{guidance}</p>
      {connector.configurationHref ? (
        <Link
          className={cn("mt-2 inline-block font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
          href={connector.configurationHref}
        >
          Open configuration
        </Link>
      ) : null}
      <details className={cn("mt-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.helper)}>
        <summary className="cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200">
          Technical details
        </summary>
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">{connector.summary}</p>
      </details>
    </li>
  );
}

function IntegrationEventBusCard(props: { readonly bus: TenantIntegrationsOperationsDto["integrationEventBus"] }): ReactElement {
  const { bus } = props;
  const humanStatus = resolveIntegrationEventBusHumanStatus(bus);
  const guidance = resolveIntegrationEventBusGuidance(bus, humanStatus);

  return (
    <li
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="connector-card-integration-event-bus"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>Integration event bus</strong>
        <Badge variant="outline" className={cn(OPERATOR_TYPOGRAPHY.helper, humanStatusBadgeClass(humanStatus))}>
          {humanStatus}
        </Badge>
      </div>
      <p className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{guidance}</p>
      <details className={cn("mt-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.helper)}>
        <summary className="cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200">
          Technical details
        </summary>
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">{formatIntegrationEventBusTechnicalDetails(bus)}</p>
      </details>
    </li>
  );
}

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

  return (
    <div className="space-y-6">
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Check whether notification, ticketing, publishing, and messaging integrations are configured for this workspace.
        These connectors are optional for first review value.
      </p>

      {CONNECTOR_PURPOSE_GROUPS.filter((group) => group.id !== "technical").map((group) => {
        const connectors = groupedConnectors.get(group.id) ?? [];

        if (connectors.length === 0) {
          return null;
        }

        return (
          <section key={group.id}>
            <h2 className={cn("m-0 font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {group.title}
            </h2>
            <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{group.description}</p>
            <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
              {connectors.map((connector) => (
                <ConnectorReadinessCard key={connector.connectorKey} connector={connector} />
              ))}
            </ul>
          </section>
        );
      })}

      <section>
        <h2 className={cn("m-0 font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Technical readiness
        </h2>
        <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Messaging infrastructure used by integration events. Expand technical details for publisher, consumer, and queue settings.
        </p>
        <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
          <IntegrationEventBusCard bus={data.integrationEventBus} />
        </ul>
      </section>
    </div>
  );
}
