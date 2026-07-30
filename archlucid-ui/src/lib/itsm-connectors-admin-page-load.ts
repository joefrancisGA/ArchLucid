import type {
  ItsmIntegrationHealthResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

export type ItsmConnectorsAdminPageLoadSlice = "health" | "settings";

export type ItsmConnectorsAdminPageLoadSliceResult<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

export type ItsmConnectorsAdminPageLoadResult = {
  readonly health: ItsmConnectorsAdminPageLoadSliceResult<ItsmIntegrationHealthResponse>;
  readonly settings: ItsmConnectorsAdminPageLoadSliceResult<TenantItsmOutboundSettingsResponse>;
  readonly failedSliceLabels: readonly string[];
  readonly loadError: string | null;
};

const SLICE_LABELS: Readonly<Record<ItsmConnectorsAdminPageLoadSlice, string>> = {
  health: "ITSM connector health",
  settings: "ITSM connector settings",
};

function reasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

export function settleItsmConnectorsAdminPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  slice: ItsmConnectorsAdminPageLoadSlice,
): ItsmConnectorsAdminPageLoadSliceResult<T> {
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

export function buildItsmConnectorsAdminPageLoadResult(args: {
  readonly health: PromiseSettledResult<ItsmIntegrationHealthResponse>;
  readonly settings: PromiseSettledResult<TenantItsmOutboundSettingsResponse>;
}): ItsmConnectorsAdminPageLoadResult {
  const health = settleItsmConnectorsAdminPageLoadSlice(args.health, "health");
  const settings = settleItsmConnectorsAdminPageLoadSlice(args.settings, "settings");

  const failedEntries: Array<{ slice: ItsmConnectorsAdminPageLoadSlice; message: string }> = [];

  if (health.failed && health.errorMessage !== null) {
    failedEntries.push({ slice: "health", message: health.errorMessage });
  }

  if (settings.failed && settings.errorMessage !== null) {
    failedEntries.push({ slice: "settings", message: settings.errorMessage });
  }

  const failedSliceLabels = failedEntries.map((entry) => SLICE_LABELS[entry.slice]);
  const firstFailure = failedEntries[0];
  const loadError =
    firstFailure === undefined
      ? null
      : failedEntries.length === 1
        ? firstFailure.message
        : `Some ITSM connector data could not be loaded (${failedSliceLabels.join(", ")}).`;

  return {
    health,
    settings,
    failedSliceLabels,
    loadError,
  };
}

export function resolveItsmAdminJiraCredentialsConfigured(
  settings: TenantItsmOutboundSettingsResponse | null,
  health: ItsmIntegrationHealthResponse | null,
  settingsLoadFailed: boolean,
): boolean {
  if (settings?.deploymentCredentials?.jiraConfigured === true) {
    return true;
  }

  if (settingsLoadFailed && settings === null) {
    return health?.jira?.locallyConfigured === true;
  }

  return false;
}

export function resolveItsmAdminServiceNowCredentialsConfigured(
  settings: TenantItsmOutboundSettingsResponse | null,
  health: ItsmIntegrationHealthResponse | null,
  settingsLoadFailed: boolean,
): boolean {
  if (settings?.deploymentCredentials?.serviceNowConfigured === true) {
    return true;
  }

  if (settingsLoadFailed && settings === null) {
    return health?.serviceNow?.locallyConfigured === true;
  }

  return false;
}
