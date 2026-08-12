"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  fetchAzureBoardsHealth,
  fetchAzureBoardsSettings,
  listAzureBoardsProjects,
  listAzureBoardsWorkItemTypes,
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
  AZURE_BOARDS_CONNECTION_SETTINGS_LEAD,
  AZURE_BOARDS_CONNECTION_SETTINGS_TITLE,
  AZURE_BOARDS_CONNECTION_STATUS_HEADING,
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_CREDENTIALS_SUMMARY,
  AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_SUMMARY,
  AZURE_BOARDS_CONNECTION_AUDIT_TRAIL_LINK_LABEL,
  AZURE_BOARDS_CONNECTION_SAVE_SUCCESS,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_COLLAPSED_SUMMARY,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_LEAD,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_TITLE,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_UNAVAILABLE_LEAD,
  AZURE_BOARDS_FIELD_AREA_PATH,
  AZURE_BOARDS_FIELD_CREDENTIAL_STATUS,
  AZURE_BOARDS_FIELD_DEFAULT_TAGS,
  AZURE_BOARDS_FIELD_ITERATION_PATH,
  AZURE_BOARDS_FIELD_ORGANIZATION_URL,
  AZURE_BOARDS_FIELD_PROJECT,
  AZURE_BOARDS_FIELD_TOKEN_REFERENCE,
  AZURE_BOARDS_FIELD_WORK_ITEM_TYPE,
  AZURE_BOARDS_MUTATION_DISABLED_HELPER,
  AZURE_BOARDS_ORGANIZATION_URL_PLACEHOLDER,
  AZURE_BOARDS_SAVE_CONNECTION_LABEL,
  AZURE_BOARDS_SAVE_SETTINGS_LABEL,
  AZURE_BOARDS_SAVE_SUCCESS,
  AZURE_BOARDS_SAVING_CONNECTION_LABEL,
  AZURE_BOARDS_SAVING_SETTINGS_LABEL,
  AZURE_BOARDS_TEST_CONNECTION_LABEL,
  AZURE_BOARDS_TEST_CONNECTION_LEAD,
  AZURE_BOARDS_TEST_CONNECTION_PENDING,
  AZURE_BOARDS_TEST_CONNECTION_TITLE,
  AZURE_BOARDS_TOKEN_REFERENCE_PLACEHOLDER,
} from "@/lib/azure-boards-page-copy";
import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";

import { AzureBoardsIntegrationAside } from "./AzureBoardsIntegrationAside";
import { AzureBoardsIntegrationPageHeader } from "./AzureBoardsIntegrationPageHeader";
import { AzureBoardsIntegrationPageLoadingSkeleton } from "./AzureBoardsIntegrationPageLoadingSkeleton";

function statusTagKind(
  status: ReturnType<typeof resolveAzureBoardsConnectionStatus>["status"],
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

  if (status === "setup-incomplete") {
    return "needs-attention";
  }

  return "neutral";
}

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
  const [workItemTypes, setWorkItemTypes] = useState<string[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [failedSliceLabels, setFailedSliceLabels] = useState<readonly string[]>([]);

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
    const [healthOutcome, itsmHealthOutcome, settingsOutcome, connectionOutcome] = await Promise.allSettled([
      fetchAzureBoardsHealth(),
      fetchItsmIntegrationHealth(),
      fetchAzureBoardsSettings(),
      fetchTenantItsmConnectorConnection("azureboards"),
    ]);

    const loaded = buildAzureBoardsPageLoadResult({
      health: healthOutcome,
      itsmHealth: itsmHealthOutcome,
      settings: settingsOutcome,
      connection: connectionOutcome,
    });

    if (!loaded.health.failed) {
      setHealth(loaded.health.value);
    }

    if (!loaded.itsmHealth.failed) {
      setItsmHealth(loaded.itsmHealth.value);
    }

    if (!loaded.settings.failed) {
      applySettings(loaded.settings.value);
    }

    if (!loaded.connection.failed) {
      applyConnection(loaded.connection.value, options?.preserveConnectionEdits === true);
    }

    setLoadError(loaded.loadError);
    setFailedSliceLabels(loaded.failedSliceLabels);
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

  useEffect(() => {
    if (!credentialsReady || projectName.trim().length === 0) {
      setWorkItemTypes([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const types = await listAzureBoardsWorkItemTypes(projectName.trim());

        if (!cancelled) {
          setWorkItemTypes(types);
        }
      } catch {
        if (!cancelled) {
          setWorkItemTypes([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [credentialsReady, projectName]);

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
      const healthResponse = await fetchAzureBoardsHealth();
      setHealth(healthResponse);
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
      const healthResponse = await fetchAzureBoardsHealth();
      setHealth(healthResponse);
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
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-azure-boards-page"
    >
      <AzureBoardsIntegrationPageHeader
        refreshing={isLoading}
        lastRefreshedAt={lastRefreshedAt}
        onRefresh={handleRefresh}
      />

      <ItsmConnectorProviderChooserRail currentProviderId="azure-boards" />

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
            <section aria-labelledby="azure-boards-status-heading" className="space-y-3" data-testid="azure-boards-connection-status">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="azure-boards-status-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {AZURE_BOARDS_CONNECTION_STATUS_HEADING}
                </h2>
                <StatusTag kind={statusTagKind(connectionStatus.status)} label={connectionStatus.label} />
              </div>
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} role="status">
                {connectionStatus.explanation}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                <span className="font-medium text-al-text-primary">Next step:</span> {connectionStatus.nextAction}
              </p>
            </section>

            {pageComposition.showConnectionSettings ? (
              <section
                aria-labelledby="azure-boards-connection-settings-heading"
                id="azure-boards-connection-settings"
                className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
                data-testid="azure-boards-connection-settings"
              >
                <div>
                  <h2 id="azure-boards-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {AZURE_BOARDS_CONNECTION_SETTINGS_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {AZURE_BOARDS_CONNECTION_SETTINGS_LEAD}
                  </p>
                </div>

                {connectionSaveError ? (
                  <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                    {connectionSaveError}
                  </p>
                ) : null}

                {connectionSaveSuccess ? (
                  <p className="m-0 text-teal-800 dark:text-teal-200" role="status">
                    {connectionSaveSuccess}
                  </p>
                ) : null}

                <div className="grid max-w-2xl gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="azure-boards-org-url">{AZURE_BOARDS_FIELD_ORGANIZATION_URL}</Label>
                    <Input
                      id="azure-boards-org-url"
                      value={organizationUrl}
                      onChange={(event) => setOrganizationUrl(event.target.value)}
                      placeholder={AZURE_BOARDS_ORGANIZATION_URL_PLACEHOLDER}
                      disabled={!canMutate || isSavingConnection}
                      data-testid="azure-boards-organization-url"
                    />
                    {!canMutate ? (
                      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="azure-boards-organization-display">
                        Saved: {organizationDisplay}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azure-boards-token-ref">{AZURE_BOARDS_FIELD_TOKEN_REFERENCE}</Label>
                    <Input
                      id="azure-boards-token-ref"
                      type="password"
                      autoComplete="off"
                      value={tokenReference}
                      onChange={(event) => setTokenReference(event.target.value)}
                      placeholder={AZURE_BOARDS_TOKEN_REFERENCE_PLACEHOLDER}
                      disabled={!canMutate || isSavingConnection}
                      data-testid="azure-boards-token-reference"
                    />
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Enter a new secure reference to replace the saved token. Leave blank to keep the existing reference.
                    </p>
                  </div>

                  <div>
                    <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {AZURE_BOARDS_FIELD_CREDENTIAL_STATUS}
                    </dt>
                    <dd className="m-0 mt-1" data-testid="azure-boards-credential-status">
                      <StatusTag kind={credentialStatusKind} label={credentialStatus} />
                    </dd>
                  </div>

                  <div data-testid="azure-boards-connection-provenance">
                    <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      Change history
                    </dt>
                    <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      <p className="m-0" role="status">
                        {connectionProvenance}
                      </p>
                      <p className="m-0 mt-2">
                        <Link
                          href={GOVERNANCE_AUDIT_PATH}
                          className={OPERATOR_LINK.inline}
                          data-testid="azure-boards-audit-trail-link"
                        >
                          {AZURE_BOARDS_CONNECTION_AUDIT_TRAIL_LINK_LABEL}
                        </Link>
                      </p>
                    </dd>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => void saveConnection()}
                      disabled={!connectionSaveGate.allowed}
                      title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                    >
                      {isSavingConnection ? AZURE_BOARDS_SAVING_CONNECTION_LABEL : AZURE_BOARDS_SAVE_CONNECTION_LABEL}
                    </Button>
                  </div>
                  <WhyDisabledCtaHint
                    reason={connectionSaveGate.reason}
                    testId="azure-boards-save-connection-disabled-helper"
                    className="max-w-3xl"
                  />
                </div>

                {!canMutate ? (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_BOARDS_MUTATION_DISABLED_HELPER}</p>
                ) : null}
              </section>
            ) : null}

            {!pageComposition.blocked && pageComposition.defaultBehaviorCollapsed ? (
              <details
                id="azure-boards-default-behavior-heading"
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="azure-boards-default-behavior-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {AZURE_BOARDS_DEFAULT_BEHAVIOR_COLLAPSED_SUMMARY}
                </summary>
                <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {AZURE_BOARDS_DEFAULT_BEHAVIOR_UNAVAILABLE_LEAD}
                </p>
              </details>
            ) : null}

            {!pageComposition.blocked && !pageComposition.defaultBehaviorCollapsed ? (
              <section
                aria-labelledby="azure-boards-default-behavior-heading"
                className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
                data-testid="azure-boards-default-behavior"
              >
                <div>
                  <h2 id="azure-boards-default-behavior-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {AZURE_BOARDS_DEFAULT_BEHAVIOR_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {AZURE_BOARDS_DEFAULT_BEHAVIOR_LEAD}
                  </p>
                </div>

                {discoveryError ? (
                  <p className="m-0 text-amber-800 dark:text-amber-200" role="status">
                    {discoveryError}
                  </p>
                ) : null}

                {saveError ? (
                  <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                    {saveError}
                  </p>
                ) : null}

                {saveSuccess ? (
                  <p className="m-0 text-teal-800 dark:text-teal-200" role="status">
                    {saveSuccess}
                  </p>
                ) : null}

                <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="azure-boards-project">{AZURE_BOARDS_FIELD_PROJECT}</Label>
                    <Select
                      value={projectName || undefined}
                      onValueChange={setProjectName}
                      disabled={!canMutate || isSaving || projects.length === 0}
                    >
                      <SelectTrigger id="azure-boards-project" data-testid="azure-boards-project-select">
                        <SelectValue placeholder={projects.length === 0 ? "Save connection first" : "Select project"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="azure-boards-work-item-type">{AZURE_BOARDS_FIELD_WORK_ITEM_TYPE}</Label>
                    <Select
                      value={workItemType || undefined}
                      onValueChange={setWorkItemType}
                      disabled={!canMutate || isSaving || workItemTypes.length === 0}
                    >
                      <SelectTrigger id="azure-boards-work-item-type" data-testid="azure-boards-work-item-type-select">
                        <SelectValue placeholder={workItemTypes.length === 0 ? "Select a project first" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {workItemTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azure-boards-area-path">{AZURE_BOARDS_FIELD_AREA_PATH}</Label>
                    <Input
                      id="azure-boards-area-path"
                      value={areaPath}
                      onChange={(event) => setAreaPath(event.target.value)}
                      disabled={!canMutate || isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="azure-boards-iteration-path">{AZURE_BOARDS_FIELD_ITERATION_PATH}</Label>
                    <Input
                      id="azure-boards-iteration-path"
                      value={iterationPath}
                      onChange={(event) => setIterationPath(event.target.value)}
                      disabled={!canMutate || isSaving}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="azure-boards-default-tags">{AZURE_BOARDS_FIELD_DEFAULT_TAGS}</Label>
                    <Input
                      id="azure-boards-default-tags"
                      value={defaultTags}
                      onChange={(event) => setDefaultTags(event.target.value)}
                      disabled={!canMutate || isSaving}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={pageComposition.saveSettingsVariant}
                    onClick={() => void saveSettings()}
                    disabled={isSaving || !canMutate || projectName.trim().length === 0 || workItemType.trim().length === 0}
                    title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                    data-testid="azure-boards-save-settings-button"
                  >
                    {isSaving ? AZURE_BOARDS_SAVING_SETTINGS_LABEL : AZURE_BOARDS_SAVE_SETTINGS_LABEL}
                  </Button>
                </div>
              </section>
            ) : null}

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
            setupSteps={setupSteps}
            emphasizedSetupStepId={pageComposition.emphasizedSetupStepId}
            lastTestAt={lastTestAt}
            lastTestSummary={lastTestSummary}
            lastTestSuccess={lastTestSuccess}
            showOperatorNotes={showOperatorNotes}
            nativeEnabled={nativeEnabled}
          />
        </div>
      )}
    </div>
  );
}
