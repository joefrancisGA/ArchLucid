"use client";

import { useCallback, useState } from "react";

import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  fetchTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmConnectorConnectionResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

export type ItsmConnectorProviderId = "jira" | "servicenow";

type ItsmConnectorPageLoadResult = {
  readonly health: { readonly failed: boolean; readonly value: ItsmIntegrationHealthResponse | null; readonly errorMessage: string | null };
  readonly settings: { readonly failed: boolean; readonly value: TenantItsmOutboundSettingsResponse | null; readonly errorMessage: string | null };
  readonly connection: { readonly failed: boolean; readonly value: TenantItsmConnectorConnectionResponse | null; readonly errorMessage: string | null };
  readonly loadError: string | null;
};

type UseItsmConnectorPageOptions = {
  readonly providerId: ItsmConnectorProviderId;
  readonly buildPageLoadResult: (outcomes: {
    readonly health: PromiseSettledResult<ItsmIntegrationHealthResponse>;
    readonly settings: PromiseSettledResult<TenantItsmOutboundSettingsResponse | null>;
    readonly connection: PromiseSettledResult<TenantItsmConnectorConnectionResponse | null>;
  }) => ItsmConnectorPageLoadResult;
  readonly applySettings: (loaded: TenantItsmOutboundSettingsResponse | null) => void;
  readonly onPageLoaded?: (loaded: ItsmConnectorPageLoadResult) => void;
};

export function useItsmConnectorPage(options: UseItsmConnectorPageOptions) {
  const { providerId, buildPageLoadResult, applySettings, onPageLoaded } = options;
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [connection, setConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsLoadFailed, setSettingsLoadFailed] = useState(false);
  const [healthLoadFailed, setHealthLoadFailed] = useState(false);
  const [connectionLoadFailed, setConnectionLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [healthOutcome, settingsOutcome, connectionOutcome] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchTenantItsmOutboundSettings(),
      fetchTenantItsmConnectorConnection(providerId),
    ]);

    const loaded = buildPageLoadResult({
      health: healthOutcome,
      settings: settingsOutcome,
      connection: connectionOutcome,
    });

    setHealthLoadFailed(loaded.health.failed);
    setSettingsLoadFailed(loaded.settings.failed);
    setConnectionLoadFailed(loaded.connection.failed);

    if (!loaded.health.failed) {
      setHealth(loaded.health.value);
    }

    if (!loaded.settings.failed) {
      setSettings(loaded.settings.value);
      applySettings(loaded.settings.value);
    }

    if (!loaded.connection.failed) {
      setConnection(loaded.connection.value);
    }

    setLoadError(loaded.loadError);
    onPageLoaded?.(loaded);
    setLastCheckedAt(new Date());
    setIsLoading(false);
  }, [applySettings, buildPageLoadResult, onPageLoaded, providerId]);

  return {
    health,
    settings,
    connection,
    loadError,
    settingsLoadFailed,
    healthLoadFailed,
    connectionLoadFailed,
    isLoading,
    lastCheckedAt,
    refresh,
    setHealth,
    setSettings,
    setConnection,
  };
}
