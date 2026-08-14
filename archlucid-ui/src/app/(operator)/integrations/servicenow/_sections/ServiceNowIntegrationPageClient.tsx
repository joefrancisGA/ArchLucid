"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  fetchItsmProviderPageBundle,
  probeItsmIntegrationHealth,
  upsertTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmConnectorConnectionResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import { DESIGN_TOKENS, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
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
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { ItsmNotConfiguredNextStep } from "../../_sections/itsm/ItsmNotConfiguredNextStep";
import { ServiceNowIntegrationAside } from "./ServiceNowIntegrationAside";
import { ServiceNowIntegrationPageHeader } from "./ServiceNowIntegrationPageHeader";

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
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setSettings(loaded);
    setSnowAutoCmdb(loaded?.serviceNowAutoCreateCmdbCi ?? false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const bundle = await fetchItsmProviderPageBundle("servicenow");

      setHealthLoadFailed(false);
      setSettingsLoadFailed(false);
      setConnectionLoadFailed(false);
      setHealth(bundle.health);
      applySettings(bundle.settings);
      setConnection(bundle.connection);
      setLoadError(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not load ServiceNow integration data.";
      setHealthLoadFailed(true);
      setSettingsLoadFailed(true);
      setConnectionLoadFailed(true);
      setLoadError(message);
    }

    setLastCheckedAt(new Date());
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
        canConfigureAdmin,
        probe,
      }),
    [canConfigureAdmin, connectionStatusLoadError, credentialsReady, isLoading, isTesting, nativeEnabled, probe],
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
      const probeResult = await probeItsmIntegrationHealth();
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
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-servicenow-page"
    >
      <ServiceNowIntegrationPageHeader
        connectionStatus={connectionStatus}
        refreshing={isLoading}
        refreshDisabled={isLoading || isSaving || isTesting}
        lastCheckedAt={lastCheckedAt}
        onRefresh={() => void refresh()}
      />

      <ItsmConnectorProviderChooserRail currentProviderId="servicenow" />

      {isLoading && health === null && settings === null ? (
        <OperatorLoadingNotice>{SERVICENOW_LOADING_MESSAGE}</OperatorLoadingNotice>
      ) : (
        <div
          className={cn("min-w-0", OPERATOR_LAYOUT.sectionStack)}
          data-testid="servicenow-page-layout"
          data-operator-side-rail-kind="none"
        >
          <div className="min-w-0 space-y-4" data-testid="servicenow-page-main">
            {loadError !== null ? (
              <p
                className={cn(
                  "m-0",
                  DESIGN_TOKENS.callout.warn,
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
                <StatusTag kind={itsmConnectionStatusTagKind(connectionStatus.status)} label={connectionStatus.label} />
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
                <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
                <p className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)} role="status">
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
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
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
