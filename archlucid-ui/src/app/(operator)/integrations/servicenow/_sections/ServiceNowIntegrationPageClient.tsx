"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { ItsmConnectorProviderChooserRail } from "@/components/ItsmConnectorProviderChooserRail";
import { ItsmConnectorsBuyerJiraServicenowVocabularyRail } from "@/components/ItsmConnectorsBuyerJiraServicenowVocabularyRail";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { PageHeading } from "@/components/PageHeading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  fetchTenantItsmOutboundSettings,
  upsertTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmConnectorConnectionResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import { DESIGN_TOKENS, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SERVICENOW_PATH } from "@/lib/integrations-nav-paths";
import {
  SERVICENOW_CMDB_AUTO_CREATE_HELPER,
  SERVICENOW_CMDB_AUTO_CREATE_LABEL,
  SERVICENOW_CONNECTION_SETTINGS_LEAD,
  SERVICENOW_CONNECTION_SETTINGS_TITLE,
  SERVICENOW_CONNECTION_STATUS_HEADING,
  SERVICENOW_CONNECTION_TEST_BUTTON,
  SERVICENOW_CONNECTION_TEST_COLLAPSED_SUMMARY,
  SERVICENOW_CONNECTION_TEST_LEAD,
  SERVICENOW_CONNECTION_TEST_PENDING,
  SERVICENOW_CONNECTION_TEST_TITLE,
  SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL,
  SERVICENOW_CREDENTIALS_ADMIN_REQUIRED,
  SERVICENOW_FIELD_AUTH_METHOD,
  SERVICENOW_FIELD_CONNECTION_LABEL,
  SERVICENOW_FIELD_CREDENTIAL_STATUS,
  SERVICENOW_FIELD_INSTANCE_URL,
  SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_SUMMARY,
  SERVICENOW_INCIDENT_SETTINGS_LEAD,
  SERVICENOW_INCIDENT_SETTINGS_TITLE,
  SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD,
  SERVICENOW_INTEGRATION_PAGE_DESCRIPTION,
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_INSTANCE_URL_NOT_SET,
  SERVICENOW_LOADING_MESSAGE,
  SERVICENOW_MUTATION_DISABLED_HELPER,
  SERVICENOW_RELOAD_BUTTON,
  SERVICENOW_SAVE_PENDING,
  SERVICENOW_SAVE_SETTINGS_BUTTON,
  SERVICENOW_SAVE_SUCCESS,
} from "@/lib/servicenow-integration-page-copy";
import {
  formatServiceNowAuthMethod,
  isServiceNowCredentialsReady,
  resolveServiceNowConnectionStatus,
  resolveServiceNowConnectionTestGate,
  resolveServiceNowCredentialStatusLabel,
  resolveServiceNowPageComposition,
  resolveServiceNowSetupSteps,
  sanitizeCustomerFacingProbeSummary,
} from "@/lib/servicenow-integration-present";
import { buildServiceNowPageLoadResult } from "@/lib/servicenow-page-load";
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm-connectors-admin-scope";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { ItsmNotConfiguredNextStep } from "../../_sections/itsm/ItsmNotConfiguredNextStep";
import { ServiceNowIntegrationAside } from "./ServiceNowIntegrationAside";
function statusTagKind(
  status: ReturnType<typeof resolveServiceNowConnectionStatus>["status"],
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

export function ServiceNowIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const showOperatorNotes = isShowSystemAdministrationNavEnabled();
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [connection, setConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsLoadFailed, setSettingsLoadFailed] = useState(false);
  const [healthLoadFailed, setHealthLoadFailed] = useState(false);
  const [connectionLoadFailed, setConnectionLoadFailed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [snowAutoCmdb, setSnowAutoCmdb] = useState(false);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setSettings(loaded);
    setSnowAutoCmdb(loaded?.serviceNowAutoCreateCmdbCi ?? false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    // Isolate slice failures so one 500 cannot wipe successful connection/settings (TB-1162).
    const [healthOutcome, settingsOutcome, connectionOutcome] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchTenantItsmOutboundSettings(),
      fetchTenantItsmConnectorConnection("servicenow"),
    ]);

    const loaded = buildServiceNowPageLoadResult({
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
      applySettings(loaded.settings.value);
    }

    if (!loaded.connection.failed) {
      setConnection(loaded.connection.value);
    }

    setLoadError(loaded.loadError);
    setIsLoading(false);
  }, [applySettings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const probe = health?.serviceNow;
  const nativeEnabled = settings?.nativeEnabled ?? health?.nativeEnabled ?? false;
  const credentialsReady = isServiceNowCredentialsReady(settings, connection, probe);

  // Settings-only failures stay in the page banner; they must not blank Connection status (TB-1162).
  const connectionStatusLoadError =
    healthLoadFailed || connectionLoadFailed ? loadError : null;

  const connectionStatus = useMemo(
    () =>
      resolveServiceNowConnectionStatus({
        isLoading,
        loadError: connectionStatusLoadError,
        isTesting,
        nativeEnabled,
        credentialsReady,
        probe,
      }),
    [connectionStatusLoadError, credentialsReady, isLoading, isTesting, nativeEnabled, probe],
  );

  const incidentSettingsEditable = canMutate && !settingsLoadFailed && settings !== null;

  const testGate = useMemo(
    () =>
      resolveServiceNowConnectionTestGate({
        nativeEnabled,
        credentialsReady,
        isTesting,
        isSaving,
      }),
    [credentialsReady, isSaving, isTesting, nativeEnabled],
  );

  const setupSteps = useMemo(
    () =>
      resolveServiceNowSetupSteps({
        nativeEnabled,
        credentialsReady,
        probe,
      }),
    [credentialsReady, nativeEnabled, probe],
  );

  const pageComposition = useMemo(
    () =>
      resolveServiceNowPageComposition({
        nativeEnabled,
        credentialsReady,
        testGateAllowed: testGate.allowed,
      }),
    [credentialsReady, nativeEnabled, testGate.allowed],
  );

  const runConnectionTest = useCallback(async () => {
    if (!testGate.allowed) {
      return;
    }

    setIsTesting(true);
    setTestError(null);

    try {
      const probeResult = await fetchItsmIntegrationHealth();
      setHealth(probeResult);
      const snowProbe = probeResult.serviceNow;
      const summary = sanitizeCustomerFacingProbeSummary(snowProbe?.summary);
      const success = snowProbe?.reachable === true;
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(
        success
          ? summary.length > 0
            ? summary
            : "Connection check succeeded."
          : summary.length > 0
            ? summary
            : "Connection check failed. Verify the instance URL and credentials.",
      );
      setLastTestSuccess(success);
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

  const saveSettings = useCallback(async () => {
    if (!canMutate || settingsLoadFailed || settings === null) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const saved = await upsertTenantItsmOutboundSettings({
        serviceNowAutoCreateCmdbCi: snowAutoCmdb,
      });
      applySettings(saved);
      setSaveSuccess(SERVICENOW_SAVE_SUCCESS);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save incident creation settings.");
    } finally {
      setIsSaving(false);
    }
  }, [applySettings, canMutate, settings, settingsLoadFailed, snowAutoCmdb]);

  const instanceUrl = connection?.instanceBaseUrl?.trim() || SERVICENOW_INSTANCE_URL_NOT_SET;
  const authMethod = formatServiceNowAuthMethod(connection?.authMode);
  const credentialStatus = resolveServiceNowCredentialStatusLabel(settings, connection, credentialsReady);
  const connectionLabel = connection?.label?.trim();

  const incidentSettingsBody = (
    <>
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

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="snow-auto-cmdb"
            checked={snowAutoCmdb}
            onCheckedChange={(checked) => setSnowAutoCmdb(checked === true)}
            disabled={isSaving || !incidentSettingsEditable}
            aria-describedby="snow-auto-cmdb-helper"
          />
          <div className="space-y-1">
            <Label htmlFor="snow-auto-cmdb">{SERVICENOW_CMDB_AUTO_CREATE_LABEL}</Label>
            <p id="snow-auto-cmdb-helper" className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {SERVICENOW_CMDB_AUTO_CREATE_HELPER}
            </p>
          </div>
        </div>
      </div>

      {settingsLoadFailed ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Incident creation settings could not be loaded. Reload the page before changing them.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isSaving || !incidentSettingsEditable}
          title={
            !canMutate
              ? enterpriseMutationControlDisabledTitle
              : settingsLoadFailed || settings === null
                ? "Reload incident creation settings before saving."
                : undefined
          }
        >
          {isSaving ? SERVICENOW_SAVE_PENDING : SERVICENOW_SAVE_SETTINGS_BUTTON}
        </Button>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isSaving || isTesting}>
          {SERVICENOW_RELOAD_BUTTON}
        </Button>
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SERVICENOW_MUTATION_DISABLED_HELPER}</p>
      ) : null}
    </>
  );

  const connectionTestBody = (
    <>
      {testError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {testError}
        </p>
      ) : null}

      {!testGate.allowed && testGate.reason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="servicenow-test-disabled-reason">
          {testGate.reason}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => void runConnectionTest()}
        disabled={!testGate.allowed}
        aria-describedby={!testGate.allowed ? "servicenow-test-disabled-reason" : undefined}
      >
        {isTesting ? SERVICENOW_CONNECTION_TEST_PENDING : SERVICENOW_CONNECTION_TEST_BUTTON}
      </Button>

      <p className="m-0">
        <Link href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF} className={cn(OPERATOR_LINK.inline)}>
          {SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL}
        </Link>
      </p>
    </>
  );

  return (
    <div
      className="w-full max-w-[68rem] space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      data-testid="integrations-servicenow-page"
    >
      <PageHeading
        navHref={INTEGRATIONS_SERVICENOW_PATH}
        title={SERVICENOW_INTEGRATION_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-2xl leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
              {SERVICENOW_INTEGRATION_PAGE_DESCRIPTION}
            </p>
            <p className={cn("m-0 max-w-2xl", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={INTEGRATIONS_READINESS_PATH} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
                Integration readiness
              </Link>
              {" — status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks."}
            </p>
          </>
        }
      />

      <ItsmConnectorsBuyerJiraServicenowVocabularyRail currentSurfaceId="servicenow" />

      <ItsmConnectorProviderChooserRail currentProviderId="servicenow" />

{isLoading && health === null && settings === null ? (
        <OperatorLoadingNotice>{SERVICENOW_LOADING_MESSAGE}</OperatorLoadingNotice>
      ) : (
        <div
          className={cn(OPERATOR_LAYOUT.majorSectionGap)}
          data-operator-side-rail-kind="none"
        >
          <div className="min-w-0 space-y-8" data-testid="servicenow-page-main">
            {loadError !== null ? (
              <p
                className={cn(
                  "m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                role="alert"
                data-testid="servicenow-page-load-error"
              >
                {loadError}
              </p>
            ) : null}

            <section aria-labelledby="servicenow-status-heading" className="space-y-3" data-testid="servicenow-connection-status">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="servicenow-status-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {SERVICENOW_CONNECTION_STATUS_HEADING}
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

            {pageComposition.showNotConfiguredNextStep ? (
              <ItsmNotConfiguredNextStep
                product="servicenow"
                productTitle={SERVICENOW_INTEGRATION_PAGE_TITLE}
                canConfigureAdmin={canConfigureAdmin}
              />
            ) : null}

            <section aria-labelledby="servicenow-connection-settings-heading" className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800">
              <div>
                <h2 id="servicenow-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {SERVICENOW_CONNECTION_SETTINGS_TITLE}
                </h2>
                <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {SERVICENOW_CONNECTION_SETTINGS_LEAD}
                </p>
              </div>

              <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_INSTANCE_URL}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-instance-url">
                    {instanceUrl}
                  </dd>
                </div>
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_AUTH_METHOD}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-auth-method">
                    {authMethod}
                  </dd>
                </div>
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_CREDENTIAL_STATUS}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-credential-status">
                    {credentialStatus}
                  </dd>
                </div>
                {connectionLabel ? (
                  <div>
                    <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_CONNECTION_LABEL}</dt>
                    <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{connectionLabel}</dd>
                  </div>
                ) : null}
              </dl>

              {!credentialsReady ? (
                <p className={cn("m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} role="status">
                  {SERVICENOW_CREDENTIALS_ADMIN_REQUIRED}
                </p>
              ) : null}
            </section>

            {pageComposition.incidentSettingsCollapsed ? (
              <details
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="servicenow-incident-settings-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_SUMMARY}
                </summary>
                <div className="mt-3 space-y-3">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD}
                  </p>
                </div>
              </details>
            ) : (
              <section
                aria-labelledby="servicenow-incident-settings-heading"
                className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
                data-testid="servicenow-incident-settings"
              >
                <div>
                  <h2 id="servicenow-incident-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {SERVICENOW_INCIDENT_SETTINGS_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {SERVICENOW_INCIDENT_SETTINGS_LEAD}
                  </p>
                </div>

                {incidentSettingsBody}
              </section>
            )}

            {pageComposition.showConnectionTest ? (
              <section
                aria-labelledby="servicenow-test-heading"
                className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
                data-testid="servicenow-connection-test"
              >
                <div>
                  <h2 id="servicenow-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {SERVICENOW_CONNECTION_TEST_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {SERVICENOW_CONNECTION_TEST_LEAD}
                  </p>
                </div>

                {connectionTestBody}
              </section>
            ) : pageComposition.connectionTestCollapsed ? (
              <details
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="servicenow-connection-test-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {SERVICENOW_CONNECTION_TEST_COLLAPSED_SUMMARY}
                </summary>
                <div className="mt-3 space-y-3">
                  {connectionTestBody}
                </div>
              </details>
            ) : null}

          </div>

          <ServiceNowIntegrationAside
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
