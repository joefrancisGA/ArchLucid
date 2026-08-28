"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchAzureBoardsSettings,
  listAzureBoardsProjects,
  type AzureBoardsIntegrationHealthResponse,
  type AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";
import { buildAzureBoardsPageLoadResult } from "@/lib/azure-boards-page-load";
import {
  mapAzureBoardsHealthFromSettings,
} from "@/lib/azure-boards-stored-health";
import { isAzureBoardsCredentialsReady } from "@/lib/azure-boards-integration-present";
import type { IntegrationZoneLoadSlice } from "@/lib/integration-zone-recovery";

export type UseAzureBoardsPageLoadOptions = {
  readonly setProjectName: React.Dispatch<React.SetStateAction<string>>;
  readonly setWorkItemType: React.Dispatch<React.SetStateAction<string>>;
  readonly setAreaPath: React.Dispatch<React.SetStateAction<string>>;
  readonly setIterationPath: React.Dispatch<React.SetStateAction<string>>;
  readonly setDefaultTags: React.Dispatch<React.SetStateAction<string>>;
  readonly setOrganizationUrl: React.Dispatch<React.SetStateAction<string>>;
  readonly setTokenReference: React.Dispatch<React.SetStateAction<string>>;
  readonly setLastTestAt: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLastTestSummary: React.Dispatch<React.SetStateAction<string | null>>;
  readonly setLastTestSuccess: React.Dispatch<React.SetStateAction<boolean | null>>;
};

export function useAzureBoardsPageLoad({
  setProjectName,
  setWorkItemType,
  setAreaPath,
  setIterationPath,
  setDefaultTags,
  setOrganizationUrl,
  setTokenReference,
  setLastTestAt,
  setLastTestSummary,
  setLastTestSuccess,
}: UseAzureBoardsPageLoadOptions) {
  const [health, setHealth] = useState<AzureBoardsIntegrationHealthResponse | null>(null);
  const [itsmHealth, setItsmHealth] = useState<{ nativeEnabled?: boolean } | null>(null);
  const [settings, setSettings] = useState<AzureBoardsOutboundSettingsResponse | null>(null);
  const [connection, setConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<string[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [failedSliceLabels, setFailedSliceLabels] = useState<readonly string[]>([]);
  const [zoneLoadSlices, setZoneLoadSlices] = useState<readonly IntegrationZoneLoadSlice[]>([]);

  const applySettings = useCallback((loaded: AzureBoardsOutboundSettingsResponse | null) => {
    setSettings(loaded);
    setProjectName(loaded?.projectName ?? "");
    setWorkItemType(loaded?.defaultWorkItemType ?? "");
    setAreaPath(loaded?.areaPath ?? "");
    setIterationPath(loaded?.iterationPath ?? "");
    setDefaultTags(loaded?.defaultTags ?? "");
    setLastTestAt(loaded?.lastConnectionTestUtc ?? null);
    setLastTestSummary(loaded?.lastConnectionTestSummary ?? null);
    setLastTestSuccess(
      loaded?.lastConnectionTestUtc ? loaded.lastConnectionTestSummary?.toLowerCase().includes("succeed") ?? null : null,
    );
  }, [setAreaPath, setDefaultTags, setIterationPath, setLastTestAt, setLastTestSuccess, setLastTestSummary, setProjectName, setWorkItemType]);

  const applyConnection = useCallback(
    (loaded: TenantItsmConnectorConnectionResponse | null, preserveUserEdits = false) => {
      setConnection(loaded);

      if (!preserveUserEdits) {
        setOrganizationUrl(loaded?.instanceBaseUrl ?? "");
        setTokenReference("");
      }
    },
    [setOrganizationUrl, setTokenReference],
  );

  const refresh = useCallback(
    async (refreshOptions?: { preserveConnectionEdits?: boolean }) => {
    setIsLoading(true);
    setLoadError(null);

    // Isolate slice failures so one 500 cannot wipe successful connection/settings (TB-1152).
    // Health is derived from settings last-test + connection — GET /health is not a live probe.
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
      applySettings(loaded.settings.value);
      setHealth(
        mapAzureBoardsHealthFromSettings(
          !loaded.connection.failed && isAzureBoardsCredentialsReady(loaded.connection.value, null),
          loaded.settings.value,
        ),
      );
    }

    if (!loaded.connection.failed) {
      applyConnection(loaded.connection.value, refreshOptions?.preserveConnectionEdits === true);
    }

    setLoadError(loaded.loadError);
    setFailedSliceLabels(loaded.failedSliceLabels);
    setZoneLoadSlices([
      {
        id: "itsm-health",
        label: "Work management health",
        failed: loaded.itsmHealth.failed,
        errorMessage: loaded.itsmHealth.errorMessage,
      },
      {
        id: "settings",
        label: "Azure Boards settings",
        failed: loaded.settings.failed,
        errorMessage: loaded.settings.errorMessage,
      },
      {
        id: "connection",
        label: "Azure Boards connection",
        failed: loaded.connection.failed,
        errorMessage: loaded.connection.errorMessage,
      },
    ]);
    setLastRefreshedAt(new Date());
    setHasLoadedOnce(true);
    setIsLoading(false);
  }, [applyConnection, applySettings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const credentialsReady = isAzureBoardsCredentialsReady(connection, health);

  const loadDiscovery = useCallback(async () => {
    if (!credentialsReady) {
      return;
    }

    setDiscoveryError(null);

    try {
      const projectList = await listAzureBoardsProjects();
      setProjects(projectList);
    } catch (error: unknown) {
      setDiscoveryError(error instanceof Error ? error.message : "Could not load projects.");
    }
  }, [credentialsReady]);

  useEffect(() => {
    void loadDiscovery();
  }, [loadDiscovery]);

  return {
    health,
    setHealth,
    itsmHealth,
    settings,
    connection,
    loadError,
    isLoading,
    projects,
    discoveryError,
    lastRefreshedAt,
    hasLoadedOnce,
    failedSliceLabels,
    zoneLoadSlices,
    credentialsReady,
    applySettings,
    applyConnection,
    refresh,
    loadDiscovery,
  };
}
