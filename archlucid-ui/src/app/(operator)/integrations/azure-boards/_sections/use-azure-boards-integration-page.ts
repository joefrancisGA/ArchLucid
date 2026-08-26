"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAzureBoardsWorkItemTypesQuery } from "@/hooks/use-azure-boards-work-item-types-query";
import {
  fetchAzureBoardsSettings,
  listAzureBoardsProjects,
  testAzureBoardsConnection,
  upsertAzureBoardsSettings,
  type AzureBoardsIntegrationHealthResponse,
  type AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  upsertTenantItsmConnectorConnection,
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";
import { buildAzureBoardsPageLoadResult } from "@/lib/azure-boards-page-load";
import {
  mapAzureBoardsHealthFromConnectionTest,
  mapAzureBoardsHealthFromSettings,
} from "@/lib/azure-boards-stored-health";
import {
  formatAzureBoardsOrganizationUrl,
  isAzureBoardsConnectionSaveSuccessful,
  isAzureBoardsCredentialsReady,
  resolveAzureBoardsConnectionProvenance,
  resolveAzureBoardsConnectionSaveGate,
  resolveAzureBoardsConnectionStatus,
  resolveAzureBoardsConnectionTestGate,
  resolveAzureBoardsCredentialStatusKind,
  resolveAzureBoardsCredentialStatusLabel,
  resolveAzureBoardsPageComposition,
  resolveAzureBoardsSetupSteps,
  sanitizeCustomerFacingProbeSummary,
} from "@/lib/azure-boards-integration-present";
import {
  AZURE_BOARDS_CONNECTION_SAVE_SUCCESS,
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_CREDENTIALS_SUMMARY,
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_SUMMARY,
  AZURE_BOARDS_SAVE_SUCCESS,
} from "@/lib/azure-boards-page-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";

export type UseAzureBoardsIntegrationPageResult = {
  readonly canMutate: boolean;
  readonly showOperatorNotes: boolean;
  readonly health: AzureBoardsIntegrationHealthResponse | null;
  readonly itsmHealth: { nativeEnabled?: boolean } | null;
  readonly settings: AzureBoardsOutboundSettingsResponse | null;
  readonly connection: TenantItsmConnectorConnectionResponse | null;
  readonly loadError: string | null;
  readonly saveError: string | null;
  readonly connectionSaveError: string | null;
  readonly saveSuccess: string | null;
  readonly connectionSaveSuccess: string | null;
  readonly testError: string | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly isSavingConnection: boolean;
  readonly isTesting: boolean;
  readonly organizationUrl: string;
  readonly setOrganizationUrl: React.Dispatch<React.SetStateAction<string>>;
  readonly tokenReference: string;
  readonly setTokenReference: React.Dispatch<React.SetStateAction<string>>;
  readonly projectName: string;
  readonly setProjectName: React.Dispatch<React.SetStateAction<string>>;
  readonly workItemType: string;
  readonly setWorkItemType: React.Dispatch<React.SetStateAction<string>>;
  readonly areaPath: string;
  readonly setAreaPath: React.Dispatch<React.SetStateAction<string>>;
  readonly iterationPath: string;
  readonly setIterationPath: React.Dispatch<React.SetStateAction<string>>;
  readonly defaultTags: string;
  readonly setDefaultTags: React.Dispatch<React.SetStateAction<string>>;
  readonly projects: string[];
  readonly workItemTypes: string[];
  readonly discoveryError: string | null;
  readonly lastTestAt: string | null;
  readonly lastTestSummary: string | null;
  readonly lastTestSuccess: boolean | null;
  readonly lastRefreshedAt: Date | null;
  readonly isInitialLoad: boolean;
  readonly isRefreshing: boolean;
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly hasUnsavedConnectionEdits: boolean;
  readonly settingsReady: boolean;
  readonly connectionStatus: ReturnType<typeof resolveAzureBoardsConnectionStatus>;
  readonly testGate: ReturnType<typeof resolveAzureBoardsConnectionTestGate>;
  readonly connectionSaveGate: ReturnType<typeof resolveAzureBoardsConnectionSaveGate>;
  readonly pageComposition: ReturnType<typeof resolveAzureBoardsPageComposition>;
  readonly integrationZoneRecoveries: ReturnType<typeof buildIntegrationZoneRecoveries>;
  readonly setupSteps: ReturnType<typeof resolveAzureBoardsSetupSteps>;
  readonly credentialStatus: string;
  readonly credentialStatusKind: ReturnType<typeof resolveAzureBoardsCredentialStatusKind>;
  readonly connectionProvenance: ReturnType<typeof resolveAzureBoardsConnectionProvenance>;
  readonly organizationDisplay: string;
  readonly connectionTestCollapsedSummary: string;
  readonly handleRefresh: () => void;
  readonly saveConnection: () => Promise<void>;
  readonly saveSettings: () => Promise<void>;
  readonly runConnectionTest: () => Promise<void>;
};

export function useAzureBoardsIntegrationPage(): UseAzureBoardsIntegrationPageResult {
  const canMutate = useOperateCapability();
  const showOperatorNotes = isShowSystemAdministrationNavEnabled();
  const [health, setHealth] = useState<AzureBoardsIntegrationHealthResponse | null>(null);
  const [itsmHealth, setItsmHealth] = useState<{ nativeEnabled?: boolean } | null>(null);
  const [settings, setSettings] = useState<AzureBoardsOutboundSettingsResponse | null>(null);
  const [connection, setConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionSaveError, setConnectionSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [connectionSaveSuccess, setConnectionSaveSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [organizationUrl, setOrganizationUrl] = useState("");
  const [tokenReference, setTokenReference] = useState("");
  const [projectName, setProjectName] = useState("");
  const [workItemType, setWorkItemType] = useState("");
  const [areaPath, setAreaPath] = useState("");
  const [iterationPath, setIterationPath] = useState("");
  const [defaultTags, setDefaultTags] = useState("");
  const [projects, setProjects] = useState<string[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);
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
  }, []);

  const applyConnection = useCallback(
    (loaded: TenantItsmConnectorConnectionResponse | null, preserveUserEdits = false) => {
      setConnection(loaded);

      if (!preserveUserEdits) {
        setOrganizationUrl(loaded?.instanceBaseUrl ?? "");
        setTokenReference("");
      }
    },
    [],
  );

  const refresh = useCallback(
    async (options?: { preserveConnectionEdits?: boolean }) => {
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
      applyConnection(loaded.connection.value, options?.preserveConnectionEdits === true);
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

  const nativeEnabled = itsmHealth?.nativeEnabled ?? false;
  const credentialsReady = isAzureBoardsCredentialsReady(connection, health);
  const hasUnsavedConnectionEdits =
    organizationUrl.trim() !== (connection?.instanceBaseUrl?.trim() ?? "") || tokenReference.trim().length > 0;
  const settingsReady =
    (settings?.projectName?.trim().length ?? 0) > 0 && (settings?.defaultWorkItemType?.trim().length ?? 0) > 0;

  const workItemTypesQuery = useAzureBoardsWorkItemTypesQuery(projectName, {
    enabled: credentialsReady && projectName.trim().length > 0,
  });
  const workItemTypes = useMemo(() => {
    if (!credentialsReady || projectName.trim().length === 0) {
      return [];
    }

    return workItemTypesQuery.data ?? [];
  }, [credentialsReady, projectName, workItemTypesQuery.data]);

  const connectionStatus = useMemo(
    () =>
      resolveAzureBoardsConnectionStatus({
        isLoading,
        loadError,
        isTesting,
        nativeEnabled,
        credentialsReady,
        settingsReady,
        health,
      }),
    [credentialsReady, health, isLoading, isTesting, loadError, nativeEnabled, settingsReady],
  );

  const testGate = useMemo(
    () =>
      resolveAzureBoardsConnectionTestGate({
        nativeEnabled,
        credentialsReady,
        settingsReady: projectName.trim().length > 0 && workItemType.trim().length > 0,
        isTesting,
        isSaving,
      }),
    [credentialsReady, isSaving, isTesting, nativeEnabled, projectName, workItemType],
  );

  const connectionSaveGate = useMemo(
    () =>
      resolveAzureBoardsConnectionSaveGate({
        canMutate,
        organizationUrl,
        tokenReference,
        connection,
        isSaving: isSavingConnection,
      }),
    [canMutate, connection, isSavingConnection, organizationUrl, tokenReference],
  );

  const pageComposition = useMemo(
    () =>
      resolveAzureBoardsPageComposition({
        nativeEnabled,
        itsmHealthLoadFailed: failedSliceLabels.includes("work management health"),
        credentialsReady,
        settingsReady,
        testGateAllowed: testGate.allowed,
        connectionSliceFailed: failedSliceLabels.includes("Azure Boards connection"),
        hasConnectionPayload: connection !== null,
      }),
    [connection, credentialsReady, failedSliceLabels, nativeEnabled, settingsReady, testGate.allowed],
  );

  const integrationZoneRecoveries = useMemo(
    () => buildIntegrationZoneRecoveries(zoneLoadSlices),
    [zoneLoadSlices],
  );

  const setupSteps = useMemo(
    () =>
      resolveAzureBoardsSetupSteps({
        nativeEnabled,
        credentialsReady,
        settingsReady,
        health,
      }),
    [credentialsReady, health, nativeEnabled, settingsReady],
  );

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

  const saveConnection = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setIsSavingConnection(true);
    setConnectionSaveError(null);
    setConnectionSaveSuccess(null);

    try {
      const saved = await upsertTenantItsmConnectorConnection("azureboards", {
        instanceBaseUrl: organizationUrl.trim(),
        authMode: "BasicApiToken",
        authUserName: "",
        credentialKeyVaultSecretName: tokenReference.trim() || connection?.credentialKeyVaultSecretName || "",
        isEnabled: true,
      });
      applyConnection(saved);
      if (isAzureBoardsConnectionSaveSuccessful(saved)) {
        setConnectionSaveSuccess(AZURE_BOARDS_CONNECTION_SAVE_SUCCESS);
      }

      // New credentials are unvalidated until the operator runs Test connection.
      setHealth(
        mapAzureBoardsHealthFromSettings(isAzureBoardsConnectionSaveSuccessful(saved), {
          lastConnectionTestUtc: null,
          lastConnectionTestSummary: null,
        }),
      );
      await loadDiscovery();
    } catch (error: unknown) {
      setConnectionSaveError(error instanceof Error ? error.message : "Could not save connection.");
    } finally {
      setIsSavingConnection(false);
    }
  }, [applyConnection, canMutate, connection?.credentialKeyVaultSecretName, loadDiscovery, organizationUrl, tokenReference]);

  const saveSettings = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const saved = await upsertAzureBoardsSettings({
        projectName: projectName.trim(),
        defaultWorkItemType: workItemType.trim(),
        areaPath: areaPath.trim() || null,
        iterationPath: iterationPath.trim() || null,
        defaultTags: defaultTags.trim() || null,
      });
      applySettings(saved);
      setSaveSuccess(AZURE_BOARDS_SAVE_SUCCESS);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save work item settings.");
    } finally {
      setIsSaving(false);
    }
  }, [applySettings, areaPath, canMutate, defaultTags, iterationPath, projectName, workItemType]);

  const runConnectionTest = useCallback(async () => {
    if (!testGate.allowed) {
      return;
    }

    setIsTesting(true);
    setTestError(null);

    try {
      const result = await testAzureBoardsConnection();
      const summary = sanitizeCustomerFacingProbeSummary(result.summary);
      const success = result.ok === true;
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(
        success
          ? summary.length > 0
            ? summary
            : "Connection check succeeded."
          : summary.length > 0
            ? summary
            : "Connection check failed. Verify the organization URL and token permissions.",
      );
      setLastTestSuccess(success);
      setHealth(mapAzureBoardsHealthFromConnectionTest(result));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection test failed.";
      setTestError(message);
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(message);
      setLastTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  }, [testGate.allowed]);

  const credentialStatus = resolveAzureBoardsCredentialStatusLabel(connection, credentialsReady);
  const credentialStatusKind = resolveAzureBoardsCredentialStatusKind(credentialsReady);
  const connectionProvenance = resolveAzureBoardsConnectionProvenance(connection, hasUnsavedConnectionEdits);
  const organizationDisplay = formatAzureBoardsOrganizationUrl(connection);
  const isInitialLoad = isLoading && !hasLoadedOnce;
  const isRefreshing = isLoading && hasLoadedOnce;
  const connectionTestCollapsedSummary = credentialsReady
    ? AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_SUMMARY
    : AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_CREDENTIALS_SUMMARY;

  const handleRefresh = useCallback(() => {
    void refresh({ preserveConnectionEdits: hasUnsavedConnectionEdits });
  }, [hasUnsavedConnectionEdits, refresh]);

  return {
    canMutate,
    showOperatorNotes,
    health,
    itsmHealth,
    settings,
    connection,
    loadError,
    saveError,
    connectionSaveError,
    saveSuccess,
    connectionSaveSuccess,
    testError,
    isLoading,
    isSaving,
    isSavingConnection,
    isTesting,
    organizationUrl,
    setOrganizationUrl,
    tokenReference,
    setTokenReference,
    projectName,
    setProjectName,
    workItemType,
    setWorkItemType,
    areaPath,
    setAreaPath,
    iterationPath,
    setIterationPath,
    defaultTags,
    setDefaultTags,
    projects,
    workItemTypes,
    discoveryError,
    lastTestAt,
    lastTestSummary,
    lastTestSuccess,
    lastRefreshedAt,
    isInitialLoad,
    isRefreshing,
    nativeEnabled,
    credentialsReady,
    hasUnsavedConnectionEdits,
    settingsReady,
    connectionStatus,
    testGate,
    connectionSaveGate,
    pageComposition,
    integrationZoneRecoveries,
    setupSteps,
    credentialStatus,
    credentialStatusKind,
    connectionProvenance,
    organizationDisplay,
    connectionTestCollapsedSummary,
    handleRefresh,
    saveConnection,
    saveSettings,
    runConnectionTest,
  };
}
