import type { components } from "@/lib/openapi-schemas";

type ConnectorSurfaceStatusResponseSchema = components["schemas"]["ConnectorSurfaceStatusResponse"];

export type ConnectorSurfaceStatusDto = ConnectorSurfaceStatusResponseSchema &
  Required<
    Pick<
      ConnectorSurfaceStatusResponseSchema,
      "connectorKey" | "displayName" | "isConfigured" | "smokeReadiness" | "summary"
    >
  >;

/** Normalizes API connector rows to the stricter DTO shape used by readiness helpers. */
export function normalizeConnectorSurfaceStatus(
  connector: ConnectorSurfaceStatusResponseSchema,
): ConnectorSurfaceStatusDto {
  return {
    ...connector,
    connectorKey: connector.connectorKey ?? "",
    displayName: connector.displayName ?? connector.connectorKey ?? "",
    isConfigured: connector.isConfigured ?? false,
    smokeReadiness: connector.smokeReadiness ?? "Unknown",
    summary: connector.summary ?? "",
  };
}

type IntegrationEventBusStatusResponseSchema = components["schemas"]["IntegrationEventBusStatusResponse"];

export type IntegrationEventBusStatusDto = IntegrationEventBusStatusResponseSchema &
  Required<
    Pick<
      IntegrationEventBusStatusResponseSchema,
      | "publisherConfigured"
      | "transactionalOutboxEnabled"
      | "consumerConfigured"
      | "usesLegacyConnectionString"
      | "smokeReadiness"
    >
  >;

type TenantIntegrationsOperationsResponseSchema = components["schemas"]["TenantIntegrationsOperationsResponse"];

export type TenantIntegrationsOperationsDto = TenantIntegrationsOperationsResponseSchema & {
  connectors: ConnectorSurfaceStatusDto[];
  integrationEventBus: IntegrationEventBusStatusDto;
  /** Server snapshot instant for integration readiness counts (when provided). */
  asOfUtc?: string | null;
};
