"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  fetchAzureBoardsSettings,
  type AzureBoardsIntegrationHealthResponse,
  type AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";
import { AZURE_BOARDS_HELP_CONNECTION_STATUS_HEADING } from "@/lib/azure-boards-help-evidence-copy";
import {
  isAzureBoardsCredentialsReady,
  resolveAzureBoardsConnectionStatus,
  type AzureBoardsConnectionStatus,
} from "@/lib/azure-boards-integration-present";
import { buildAzureBoardsPageLoadResult } from "@/lib/azure-boards-page-load";
import { mapAzureBoardsHealthFromSettings } from "@/lib/azure-boards-stored-health";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function statusTagKind(
  status: AzureBoardsConnectionStatus,
): "ready" | "needs-attention" | "neutral" | "in-progress" {
  if (status === "connected") {
    return "ready";
  }

  if (status === "connection-issue") {
    return "needs-attention";
  }

  if (status === "testing") {
    return "in-progress";
  }

  return "neutral";
}

export function HelpAzureBoardsConnectionContext(): React.ReactElement {
  const [health, setHealth] = useState<AzureBoardsIntegrationHealthResponse | null>(null);
  const [itsmHealth, setItsmHealth] = useState<{ nativeEnabled?: boolean } | null>(null);
  const [settings, setSettings] = useState<AzureBoardsOutboundSettingsResponse | null>(null);
  const [connection, setConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [itsmHealthOutcome, settingsOutcome, connectionOutcome] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchAzureBoardsSettings(),
      fetchTenantItsmConnectorConnection("azureboards"),
    ]);

    const loaded = buildAzureBoardsPageLoadResult({
      itsmHealth: itsmHealthOutcome,
      settings: settingsOutcome,
      connection: connectionOutcome,
    });

    if (!loaded.itsmHealth.failed) {
      setItsmHealth(loaded.itsmHealth.value);
    }

    if (!loaded.settings.failed) {
      setSettings(loaded.settings.value);
      setHealth(
        mapAzureBoardsHealthFromSettings(
          !loaded.connection.failed && isAzureBoardsCredentialsReady(loaded.connection.value, null),
          loaded.settings.value,
        ),
      );
    }

    if (!loaded.connection.failed) {
      setConnection(loaded.connection.value);
    }

    setLoadError(loaded.loadError);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nativeEnabled = itsmHealth?.nativeEnabled ?? false;
  const credentialsReady = isAzureBoardsCredentialsReady(connection, health);
  const settingsReady =
    (settings?.projectName?.trim().length ?? 0) > 0 && (settings?.defaultWorkItemType?.trim().length ?? 0) > 0;

  const connectionStatus = useMemo(
    () =>
      resolveAzureBoardsConnectionStatus({
        isLoading,
        loadError,
        isTesting: false,
        nativeEnabled,
        credentialsReady,
        settingsReady,
        health,
      }),
    [credentialsReady, health, isLoading, loadError, nativeEnabled, settingsReady],
  );

  return (
    <div className="space-y-2" data-testid="help-azure-boards-connection-context">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {AZURE_BOARDS_HELP_CONNECTION_STATUS_HEADING}
        </h3>
        <StatusTag
          kind={statusTagKind(connectionStatus.status)}
          label={connectionStatus.label}
          data-testid="help-azure-boards-connection-status-tag"
        />
      </div>
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} role="status">
        {connectionStatus.explanation}
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">Next step:</span> {connectionStatus.nextAction}
      </p>
    </div>
  );
}
