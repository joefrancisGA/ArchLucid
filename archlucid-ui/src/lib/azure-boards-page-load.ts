import {
  buildIntegrationPageLoadError,
  settleIntegrationPageLoadSlice,
} from "@/lib/integrations/settle-integration-page-load-slices";
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

export function settleAzureBoardsPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  slice: AzureBoardsPageLoadSlice,
): AzureBoardsPageLoadSliceResult<T> {
  return settleIntegrationPageLoadSlice(outcome, SLICE_LABELS[slice]);
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
  const loadError = buildIntegrationPageLoadError(
    failedEntries.map((entry) => ({ label: SLICE_LABELS[entry.slice], message: entry.message })),
    "Azure Boards",
  );

  return {
    itsmHealth,
    settings,
    connection,
    failedSliceLabels,
    loadError,
  };
}
