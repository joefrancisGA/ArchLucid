import type { components } from "@/lib/openapi-schemas";

type PilotFunnelSnapshotResponseSchema = components["schemas"]["PilotFunnelSnapshotResponse"];

export type PilotFunnelSnapshotDto = PilotFunnelSnapshotResponseSchema &
  Required<
    Pick<
      PilotFunnelSnapshotResponseSchema,
      "totalRunsInScope" | "committedRunsInScope" | "productLearningSignalsLast90Days"
    >
  >;

type OperatorStickinessSnapshotResponseSchema = components["schemas"]["OperatorStickinessSnapshotResponse"];

export type OperatorStickinessSnapshotDto = OperatorStickinessSnapshotResponseSchema & {
  pilotFunnel: PilotFunnelSnapshotDto;
} & Required<
  Pick<OperatorStickinessSnapshotResponseSchema, "comparisonEventsLast30Days" | "pendingGovernanceApprovals">
>;

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

type WeeklyDigestHealthResponseSchema = components["schemas"]["WeeklyDigestHealthResponse"];

export type WeeklyDigestHealthDto = WeeklyDigestHealthResponseSchema &
  Required<
    Pick<
      WeeklyDigestHealthResponseSchema,
      | "enabledAdvisoryScheduleCount"
      | "digestSubscriptionCount"
      | "enabledDigestSubscriptionCount"
      | "digestSubscriptionsByEmailChannel"
      | "digestSubscriptionsBySlackChannel"
      | "digestSubscriptionsByTeamsChannel"
      | "executiveEmailDigestIsConfigured"
      | "executiveEmailDigestEnabled"
      | "executiveDigestRecipientCount"
      | "executiveDigestIanaTimeZoneId"
      | "executiveDigestDayOfWeek"
      | "executiveDigestHourOfDay"
      | "setupGaps"
    >
  >;

type AlertDeliveryAttemptResponseSchema = components["schemas"]["AlertDeliveryAttemptResponse"];

export type AlertDeliveryAttemptDto = AlertDeliveryAttemptResponseSchema &
  Required<
    Pick<AlertDeliveryAttemptResponseSchema, "channelType" | "status" | "attemptedUtc" | "destinationRedacted">
  >;

type AlertActionLoopResponseSchema = components["schemas"]["AlertActionLoopResponse"];

export type AlertActionLoopDto = AlertActionLoopResponseSchema &
  Required<Pick<AlertActionLoopResponseSchema, "alertId" | "status" | "deliveryAttempts">> & {
    deliveryAttempts: AlertDeliveryAttemptDto[];
  };
