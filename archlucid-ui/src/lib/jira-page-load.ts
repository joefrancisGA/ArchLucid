import type {
  ItsmIntegrationHealthResponse,
  TenantItsmConnectorConnectionResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

export type JiraPageLoadSlice = "health" | "settings" | "connection";

export type JiraPageLoadSliceResult<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

export type JiraPageLoadResult = {
  readonly health: JiraPageLoadSliceResult<ItsmIntegrationHealthResponse>;
  readonly settings: JiraPageLoadSliceResult<TenantItsmOutboundSettingsResponse | null>;
  readonly connection: JiraPageLoadSliceResult<TenantItsmConnectorConnectionResponse | null>;
  readonly failedSliceLabels: readonly string[];
  readonly loadError: string | null;
};

const SLICE_LABELS: Readonly<Record<JiraPageLoadSlice, string>> = {
  health: "Jira health",
  settings: "Jira settings",
  connection: "Jira connection",
};

function reasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

export function settleJiraPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  slice: JiraPageLoadSlice,
): JiraPageLoadSliceResult<T> {
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

export function buildJiraPageLoadResult(args: {
  readonly health: PromiseSettledResult<ItsmIntegrationHealthResponse>;
  readonly settings: PromiseSettledResult<TenantItsmOutboundSettingsResponse | null>;
  readonly connection: PromiseSettledResult<TenantItsmConnectorConnectionResponse | null>;
}): JiraPageLoadResult {
  const health = settleJiraPageLoadSlice(args.health, "health");
  const settings = settleJiraPageLoadSlice(args.settings, "settings");
  const connection = settleJiraPageLoadSlice(args.connection, "connection");

  const failedEntries: Array<{ slice: JiraPageLoadSlice; message: string }> = [];

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
        : `Some Jira data could not be loaded (${failedSliceLabels.join(", ")}).`;

  return {
    health,
    settings,
    connection,
    failedSliceLabels,
    loadError,
  };
}
