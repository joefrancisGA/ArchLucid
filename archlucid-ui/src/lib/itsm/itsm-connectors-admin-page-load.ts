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

const RAW_LOAD_ERROR_PATTERNS: readonly RegExp[] = [
  /database query failed/i,
  /programming error/i,
  /the database rejected the query/i,
  /\b5\d{2}\b/,
  /internal server error/i,
];

export const ITSM_CONNECTORS_ADMIN_HEALTH_LOAD_FAILURE_EXPLANATION =
  "ArchLucid could not load ITSM connector health for this deployment. Use Retry or contact support if the problem continues.";

export const ITSM_CONNECTORS_ADMIN_SETTINGS_LOAD_FAILURE_EXPLANATION =
  "ArchLucid could not load ITSM connector settings for this tenant. Use Retry or contact support if the problem continues.";

function sliceLoadFailureExplanation(slice: ItsmConnectorsAdminPageLoadSlice): string {
  if (slice === "health") {
    return ITSM_CONNECTORS_ADMIN_HEALTH_LOAD_FAILURE_EXPLANATION;
  }

  return ITSM_CONNECTORS_ADMIN_SETTINGS_LOAD_FAILURE_EXPLANATION;
}

/** Maps API problem titles / SQL mapper leaks out of admin ITSM load banners (TB-1432 / TB-1163 parity). */
export function sanitizeItsmConnectorsAdminLoadError(
  loadError: string | null | undefined,
  slice: ItsmConnectorsAdminPageLoadSlice,
): string | null {
  if (loadError === null || loadError === undefined) {
    return null;
  }

  const trimmed = loadError.trim();

  if (trimmed.length === 0) {
    return sliceLoadFailureExplanation(slice);
  }

  if (RAW_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(`[itsm-connectors-admin] ${slice} load failure (raw detail not shown):`, trimmed);
    }

    return sliceLoadFailureExplanation(slice);
  }

  return trimmed;
}

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
