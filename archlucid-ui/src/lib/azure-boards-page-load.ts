import type { AzureBoardsOutboundSettingsResponse } from "@/lib/api/azure-boards-api";
import type { TenantItsmConnectorConnectionResponse } from "@/lib/api/itsm-outbound-api";

export type AzureBoardsPageLoadSlice = "itsmHealth" | "settings" | "connection";

export type AzureBoardsPageLoadSliceResult<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

export type AzureBoardsPageLoadResult = {
  readonly itsmHealth: AzureBoardsPageLoadSliceResult<{ nativeEnabled?: boolean }>;
  readonly settings: AzureBoardsPageLoadSliceResult<AzureBoardsOutboundSettingsResponse>;
  readonly connection: AzureBoardsPageLoadSliceResult<TenantItsmConnectorConnectionResponse>;
  readonly failedSliceLabels: readonly string[];
  readonly loadError: string | null;
};

const SLICE_LABELS: Readonly<Record<AzureBoardsPageLoadSlice, string>> = {
  itsmHealth: "work management health",
  settings: "Azure Boards settings",
  connection: "Azure Boards connection",
};

function reasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

export function settleAzureBoardsPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  slice: AzureBoardsPageLoadSlice,
): AzureBoardsPageLoadSliceResult<T> {
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

export function buildAzureBoardsPageLoadResult(args: {
  readonly itsmHealth: PromiseSettledResult<{ nativeEnabled?: boolean }>;
  readonly settings: PromiseSettledResult<AzureBoardsOutboundSettingsResponse>;
  readonly connection: PromiseSettledResult<TenantItsmConnectorConnectionResponse>;
}): AzureBoardsPageLoadResult {
  const itsmHealth = settleAzureBoardsPageLoadSlice(args.itsmHealth, "itsmHealth");
  const settings = settleAzureBoardsPageLoadSlice(args.settings, "settings");
  const connection = settleAzureBoardsPageLoadSlice(args.connection, "connection");

  const failedEntries: Array<{ slice: AzureBoardsPageLoadSlice; message: string }> = [];

  if (itsmHealth.failed && itsmHealth.errorMessage !== null) {
    failedEntries.push({ slice: "itsmHealth", message: itsmHealth.errorMessage });
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
        : `Some Azure Boards data could not be loaded (${failedSliceLabels.join(", ")}).`;

  return {
    itsmHealth,
    settings,
    connection,
    failedSliceLabels,
    loadError,
  };
}
