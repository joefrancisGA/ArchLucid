import type {
  ItsmIntegrationHealthResponse,
  TenantItsmConnectorConnectionResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

export type ServiceNowPageLoadSlice = "health" | "settings" | "connection";

export type ServiceNowPageLoadSliceResult<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

export type ServiceNowPageLoadResult = {
  readonly health: ServiceNowPageLoadSliceResult<ItsmIntegrationHealthResponse>;
  readonly settings: ServiceNowPageLoadSliceResult<TenantItsmOutboundSettingsResponse | null>;
  readonly connection: ServiceNowPageLoadSliceResult<TenantItsmConnectorConnectionResponse | null>;
  readonly failedSliceLabels: readonly string[];
  readonly loadError: string | null;
};

const SLICE_LABELS: Readonly<Record<ServiceNowPageLoadSlice, string>> = {
  health: "ServiceNow health",
  settings: "ServiceNow settings",
  connection: "ServiceNow connection",
};

function reasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

export function settleServiceNowPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  slice: ServiceNowPageLoadSlice,
): ServiceNowPageLoadSliceResult<T> {
  if (outcome.status === "fulfilled") {
    return {
      value: outcome.value,
      failed: false,
      errorMessage: null,
    };
  }

  return {
    value: null,
    failed: true,
    errorMessage: reasonMessage(outcome.reason, `Could not load ${SLICE_LABELS[slice]}.`),
  };
}

export function buildServiceNowPageLoadResult(args: {
  readonly health: PromiseSettledResult<ItsmIntegrationHealthResponse>;
  readonly settings: PromiseSettledResult<TenantItsmOutboundSettingsResponse | null>;
  readonly connection: PromiseSettledResult<TenantItsmConnectorConnectionResponse | null>;
}): ServiceNowPageLoadResult {
  const health = settleServiceNowPageLoadSlice(args.health, "health");
  const settings = settleServiceNowPageLoadSlice(args.settings, "settings");
  const connection = settleServiceNowPageLoadSlice(args.connection, "connection");

  const failedEntries: Array<{ slice: ServiceNowPageLoadSlice; message: string }> = [];

  if (health.failed && health.errorMessage !== null) {
    failedEntries.push({ slice: "health", message: health.errorMessage });
  }

  if (settings.failed && settings.errorMessage !== null) {
    failedEntries.push({ slice: "settings", message: settings.errorMessage });
  }

  if (connection.failed && connection.errorMessage !== null) {
    failedEntries.push({ slice: "connection", message: connection.errorMessage });
  }

  const failedSliceLabels = failedEntries.map((entry) => SLICE_LABELS[entry.slice]);
  const firstFailure = failedEntries[0];
  const loadError =
    firstFailure === undefined
      ? null
      : failedEntries.length === 1
        ? firstFailure.message
        : `Some ServiceNow data could not be loaded (${failedSliceLabels.join(", ")}).`;

  return {
    health,
    settings,
    connection,
    failedSliceLabels,
    loadError,
  };
}
