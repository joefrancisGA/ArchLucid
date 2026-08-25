"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  AZURE_BOARDS_TEST_CONNECTION_LABEL,
  AZURE_BOARDS_TEST_CONNECTION_LEAD,
  AZURE_BOARDS_TEST_CONNECTION_PENDING,
  AZURE_BOARDS_TEST_CONNECTION_TITLE,
} from "@/lib/azure-boards-page-copy";
import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";
import { AzureBoardsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";

import { AzureBoardsConnectionSettingsPanel } from "./AzureBoardsConnectionSettingsPanel";
import { AzureBoardsDefaultBehaviorPanel } from "./AzureBoardsDefaultBehaviorPanel";
import { AzureBoardsIntegrationAside } from "./AzureBoardsIntegrationAside";
import { AzureBoardsConnectionStatusPanel } from "./AzureBoardsConnectionStatusPanel";
import { AzureBoardsIntegrationPageHeader } from "./AzureBoardsIntegrationPageHeader";
import { AzureBoardsIntegrationPageLoadingSkeleton } from "./AzureBoardsIntegrationPageLoadingSkeleton";

export function AzureBoardsIntegrationPageClient(): React.ReactElement {
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

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-azure-boards-page"
    >
      <AzureBoardsIntegrationPageHeader
        refreshing={isLoading}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={handleRefresh}
      />

      <ItsmConnectorProviderChooserRail currentProviderId="azure-boards" />
      <AzureBoardsIntegrationEvidenceOrientationStrip />

{isInitialLoad ? (
        <AzureBoardsIntegrationPageLoadingSkeleton />
      ) : (
        <div
          className={cn(OPERATOR_LAYOUT.majorSectionGap)}
          aria-busy={isLoading}
          data-testid="azure-boards-page-content"
          data-operator-side-rail-kind="none"
        >
          {isRefreshing ? (
            <div
              className="space-y-2"
              data-testid="azure-boards-refresh-skeleton"
              aria-hidden="true"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          ) : null}

          <div className={cn("min-w-0", OPERATOR_LAYOUT.majorSectionGap, isRefreshing && "opacity-70")}>
            <AzureBoardsConnectionStatusPanel
              connectionStatus={connectionStatus}
              integrationZoneRecoveries={integrationZoneRecoveries}
            />

            {pageComposition.showConnectionSettings ? (
              <AzureBoardsConnectionSettingsPanel
                canMutate={canMutate}
                organizationUrl={organizationUrl}
                onOrganizationUrlChange={setOrganizationUrl}
                tokenReference={tokenReference}
                onTokenReferenceChange={setTokenReference}
                organizationDisplay={organizationDisplay}
                credentialStatus={credentialStatus}
                credentialStatusKind={credentialStatusKind}
                connectionProvenance={connectionProvenance}
                connectionSaveError={connectionSaveError}
                connectionSaveSuccess={connectionSaveSuccess}
                connectionSaveGate={connectionSaveGate}
                isSavingConnection={isSavingConnection}
                onSaveConnection={() => void saveConnection()}
              />
            ) : null}

            <AzureBoardsDefaultBehaviorPanel
              pageComposition={pageComposition}
              canMutate={canMutate}
              projects={projects}
              workItemTypes={workItemTypes}
              projectName={projectName}
              onProjectNameChange={setProjectName}
              workItemType={workItemType}
              onWorkItemTypeChange={setWorkItemType}
              areaPath={areaPath}
              onAreaPathChange={setAreaPath}
              iterationPath={iterationPath}
              onIterationPathChange={setIterationPath}
              defaultTags={defaultTags}
              onDefaultTagsChange={setDefaultTags}
              discoveryError={discoveryError}
              saveError={saveError}
              saveSuccess={saveSuccess}
              isSaving={isSaving}
              onSaveSettings={() => void saveSettings()}
            />

            {pageComposition.showConnectionTest ? (
              <section
                aria-labelledby="azure-boards-test-heading"
                className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
                data-testid="azure-boards-connection-test"
              >
                <div>
                  <h2 id="azure-boards-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {AZURE_BOARDS_TEST_CONNECTION_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {AZURE_BOARDS_TEST_CONNECTION_LEAD}
                  </p>
                </div>

                {testError ? (
                  <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                    {testError}
                  </p>
                ) : null}

                <Button
                  type="button"
                  onClick={() => void runConnectionTest()}
                  disabled={!testGate.allowed || isTesting}
                  data-testid="azure-boards-test-connection-button"
                >
                  {isTesting ? AZURE_BOARDS_TEST_CONNECTION_PENDING : AZURE_BOARDS_TEST_CONNECTION_LABEL}
                </Button>
              </section>
            ) : null}

            {!pageComposition.blocked && pageComposition.connectionTestCollapsed ? (
              <details
                id="azure-boards-test-heading"
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="azure-boards-connection-test-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {connectionTestCollapsedSummary}
                </summary>
                {testGate.reason ? (
                  <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="azure-boards-test-disabled-reason">
                    {testGate.reason}
                  </p>
                ) : !credentialsReady ? (
                  <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Save connection settings before running a connection test.
                  </p>
                ) : null}
              </details>
            ) : null}
          </div>

          <AzureBoardsIntegrationAside
            status={connectionStatus}
            credentialsReady={credentialsReady}
            settingsReady={settingsReady}
            connectionVerified={health?.reachable === true}
            lastTestAt={lastTestAt}
            lastTestSummary={lastTestSummary}
            lastTestSuccess={lastTestSuccess}
            showOperatorNotes={showOperatorNotes}
            nativeEnabled={nativeEnabled}
          />
        </div>
      )}
    </OperatorPageContainer>
  );
}
