"use client";

import { useCallback, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useAzureBoardsWorkItemTypesQuery } from "@/hooks/use-azure-boards-work-item-types-query";
import {
  formatAzureBoardsOrganizationUrl,
  resolveAzureBoardsConnectionProvenance,
  resolveAzureBoardsConnectionSaveGate,
  resolveAzureBoardsConnectionStatus,
  resolveAzureBoardsCredentialStatusKind,
  resolveAzureBoardsCredentialStatusLabel,
  resolveAzureBoardsPageComposition,
  resolveAzureBoardsSetupSteps,
} from "@/lib/azure-boards-integration-present";
import {
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_CREDENTIALS_SUMMARY,
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_SUMMARY,
} from "@/lib/azure-boards-page-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { buildIntegrationZoneRecoveries } from "@/lib/integration-zone-recovery";

import { useAzureBoardsConnectionMutations } from "./use-azure-boards-connection-mutations";
import { useAzureBoardsConnectionTest } from "./use-azure-boards-connection-test";
import { useAzureBoardsPageLoad } from "./use-azure-boards-page-load";

export type UseAzureBoardsIntegrationPageResult = {
  readonly canMutate: boolean;
  readonly showOperatorNotes: boolean;
  readonly health: ReturnType<typeof useAzureBoardsPageLoad>["health"];
  readonly itsmHealth: ReturnType<typeof useAzureBoardsPageLoad>["itsmHealth"];
  readonly settings: ReturnType<typeof useAzureBoardsPageLoad>["settings"];
  readonly connection: ReturnType<typeof useAzureBoardsPageLoad>["connection"];
  readonly loadError: string | null;
  readonly saveError: string | null;
  readonly connectionSaveError: string | null;
  readonly saveSuccess: string | null;
  readonly connectionSaveSuccess: string | null;
  readonly settingsLastSavedUtc: string | null;
  readonly settingsInlineSaveError: string | null;
  readonly connectionLastSavedUtc: string | null;
  readonly connectionInlineSaveError: string | null;
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
  readonly testGate: ReturnType<typeof useAzureBoardsConnectionTest>["testGate"];
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
  const [organizationUrl, setOrganizationUrl] = useState("");
  const [tokenReference, setTokenReference] = useState("");
  const [projectName, setProjectName] = useState("");
  const [workItemType, setWorkItemType] = useState("");
  const [areaPath, setAreaPath] = useState("");
  const [iterationPath, setIterationPath] = useState("");
  const [defaultTags, setDefaultTags] = useState("");
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);

  const pageLoad = useAzureBoardsPageLoad({
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
  });

  const {
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
  } = pageLoad;

  const nativeEnabled = itsmHealth?.nativeEnabled ?? false;
  const hasUnsavedConnectionEdits =
    organizationUrl.trim() !== (connection?.instanceBaseUrl?.trim() ?? "") || tokenReference.trim().length > 0;
  const settingsReady =
    (settings?.projectName?.trim().length ?? 0) > 0 && (settings?.defaultWorkItemType?.trim().length ?? 0) > 0;

  const mutations = useAzureBoardsConnectionMutations({
    canMutate,
    organizationUrl,
    tokenReference,
    projectName,
    workItemType,
    areaPath,
    iterationPath,
    defaultTags,
    connection,
    applySettings,
    applyConnection,
    setHealth,
    loadDiscovery,
  });

  const workItemTypesQuery = useAzureBoardsWorkItemTypesQuery(projectName, {
    enabled: credentialsReady && projectName.trim().length > 0,
  });
  const workItemTypes = useMemo(() => {
    if (!credentialsReady || projectName.trim().length === 0) {
      return [];
    }

    return workItemTypesQuery.data ?? [];
  }, [credentialsReady, projectName, workItemTypesQuery.data]);

  const connectionTest = useAzureBoardsConnectionTest({
    nativeEnabled,
    credentialsReady,
    settingsReady: projectName.trim().length > 0 && workItemType.trim().length > 0,
    isSaving: mutations.isSaving,
    setHealth,
    setLastTestAt,
    setLastTestSummary,
    setLastTestSuccess,
  });

  const connectionStatus = useMemo(
    () =>
      resolveAzureBoardsConnectionStatus({
        isLoading,
        loadError,
        isTesting: connectionTest.isTesting,
        nativeEnabled,
        credentialsReady,
        settingsReady,
        health,
      }),
    [connectionTest.isTesting, credentialsReady, health, isLoading, loadError, nativeEnabled, settingsReady],
  );

  const connectionSaveGate = useMemo(
    () =>
      resolveAzureBoardsConnectionSaveGate({
        canMutate,
        organizationUrl,
        tokenReference,
        connection,
        isSaving: mutations.isSavingConnection,
      }),
    [canMutate, connection, mutations.isSavingConnection, organizationUrl, tokenReference],
  );

  const pageComposition = useMemo(
    () =>
      resolveAzureBoardsPageComposition({
        nativeEnabled,
        itsmHealthLoadFailed: failedSliceLabels.includes("work management health"),
        credentialsReady,
        settingsReady,
        testGateAllowed: connectionTest.testGate.allowed,
        connectionSliceFailed: failedSliceLabels.includes("Azure Boards connection"),
        hasConnectionPayload: connection !== null,
      }),
    [connection, credentialsReady, failedSliceLabels, nativeEnabled, settingsReady, connectionTest.testGate.allowed],
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
    saveError: mutations.saveError,
    connectionSaveError: mutations.connectionSaveError,
    saveSuccess: mutations.saveSuccess,
    connectionSaveSuccess: mutations.connectionSaveSuccess,
    settingsLastSavedUtc: mutations.settingsLastSavedUtc,
    settingsInlineSaveError: mutations.settingsInlineSaveError,
    connectionLastSavedUtc: mutations.connectionLastSavedUtc,
    connectionInlineSaveError: mutations.connectionInlineSaveError,
    testError: connectionTest.testError,
    isLoading,
    isSaving: mutations.isSaving,
    isSavingConnection: mutations.isSavingConnection,
    isTesting: connectionTest.isTesting,
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
    testGate: connectionTest.testGate,
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
    saveConnection: mutations.saveConnection,
    saveSettings: mutations.saveSettings,
    runConnectionTest: connectionTest.runConnectionTest,
  };
}
