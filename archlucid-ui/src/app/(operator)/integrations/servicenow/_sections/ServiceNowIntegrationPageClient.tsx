"use client";

import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { ServiceNowIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { useItsmConnectorPage } from "@/hooks/use-itsm-connector-page";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  probeItsmIntegrationHealth,
  upsertTenantItsmOutboundSettings,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import {
  SERVICENOW_CONNECTION_STATUS_HEADING,
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_INSTANCE_URL_NOT_SET,
  SERVICENOW_LOADING_MESSAGE,
  SERVICENOW_SAVE_SUCCESS,
} from "@/lib/servicenow-integration-page-copy";
import {
  formatServiceNowAuthMethod,
  isServiceNowCredentialsReady,
  resolveServiceNowConnectionStatus,
  resolveServiceNowConnectionTestGate,
  resolveServiceNowCredentialStatusLabel,
  resolveServiceNowPageComposition,
  sanitizeCustomerFacingProbeSummary,
} from "@/lib/servicenow-integration-present";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buildServiceNowPageLoadResult } from "@/lib/servicenow-page-load";
import {
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";

import { ItsmNotConfiguredNextStep } from "../../_sections/itsm/ItsmNotConfiguredNextStep";
import { ServiceNowConnectionSettingsPanel } from "./ServiceNowConnectionSettingsPanel";
import { ServiceNowConnectionTestPanel } from "./ServiceNowConnectionTestPanel";
import { ServiceNowIncidentSettingsPanel } from "./ServiceNowIncidentSettingsPanel";
import { ServiceNowIntegrationAside } from "./ServiceNowIntegrationAside";
import { ServiceNowIntegrationPageHeader } from "./ServiceNowIntegrationPageHeader";

export function ServiceNowIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const showOperatorNotes = isShowSystemAdministrationNavEnabled();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [snowAutoCmdb, setSnowAutoCmdb] = useState(false);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);
  const [zoneLoadSlices, setZoneLoadSlices] = useState<readonly IntegrationZoneLoadSlice[]>([]);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setSnowAutoCmdb(loaded?.serviceNowAutoCreateCmdbCi ?? false);
  }, []);

  const onPageLoaded = useCallback(
    (loaded: {
      readonly health: { readonly failed: boolean; readonly errorMessage: string | null };
      readonly settings: { readonly failed: boolean; readonly errorMessage: string | null };
      readonly connection: { readonly failed: boolean; readonly errorMessage: string | null };
    }) => {
    setZoneLoadSlices([
      {
        id: "health",
        label: "ServiceNow health",
        failed: loaded.health.failed,
        errorMessage: loaded.health.errorMessage ?? null,
      },
      {
        id: "settings",
        label: "ServiceNow settings",
        failed: loaded.settings.failed,
        errorMessage: loaded.settings.errorMessage ?? null,
      },
      {
        id: "connection",
        label: "ServiceNow connection",
        failed: loaded.connection.failed,
        errorMessage: loaded.connection.errorMessage ?? null,
      },
    ]);
  }, []);

  const {
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
  } = useItsmConnectorPage({
    providerId: "servicenow",
    buildPageLoadResult: buildServiceNowPageLoadResult,
    applySettings,
    onPageLoaded,
  });

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

  const pageComposition = useMemo(
    () =>
      resolveServiceNowPageComposition({
        nativeEnabled,
        credentialsReady,
        testGateAllowed: testGate.allowed,
      }),
    [credentialsReady, nativeEnabled, testGate.allowed],
  );

  const integrationZoneRecoveries = useMemo(
    () => buildIntegrationZoneRecoveries(zoneLoadSlices),
    [zoneLoadSlices],
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
  }, [setHealth, testGate.allowed]);

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

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
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
      <ServiceNowIntegrationEvidenceOrientationStrip />

      {isLoading && health === null && settings === null ? (
        <OperatorLoadingNotice>{SERVICENOW_LOADING_MESSAGE}</OperatorLoadingNotice>
      ) : (
        <div
          className={cn("min-w-0", OPERATOR_LAYOUT.sectionStack)}
          data-testid="servicenow-page-layout"
          data-operator-side-rail-kind="none"
        >
          <div className="min-w-0 space-y-4" data-testid="servicenow-page-main">
            {integrationZoneRecoveries.length > 0 ? (
              <div className="space-y-3" data-testid="servicenow-zone-recoveries">
                {integrationZoneRecoveries.map((recovery) => (
                  <IntegrationZoneRecoveryCard key={recovery.zoneId} recovery={recovery} />
                ))}
              </div>
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

            <ServiceNowConnectionSettingsPanel
              instanceUrl={instanceUrl}
              authMethod={authMethod}
              credentialStatus={credentialStatus}
              connectionLabel={connectionLabel}
              credentialsReady={credentialsReady}
            />

            <ServiceNowIncidentSettingsPanel
              pageComposition={pageComposition}
              canMutate={canMutate}
              incidentSettingsEditable={incidentSettingsEditable}
              settingsLoadFailed={settingsLoadFailed}
              settings={settings}
              snowAutoCmdb={snowAutoCmdb}
              onSnowAutoCmdbChange={setSnowAutoCmdb}
              saveError={saveError}
              saveSuccess={saveSuccess}
              isSaving={isSaving}
              isTesting={isTesting}
              onSaveSettings={() => void saveSettings()}
              onRefresh={() => void refresh()}
            />

            <ServiceNowConnectionTestPanel
              pageComposition={pageComposition}
              testGate={testGate}
              testError={testError}
              isTesting={isTesting}
              onRunConnectionTest={() => void runConnectionTest()}
            />
          </div>

          <ServiceNowIntegrationAside
            status={connectionStatus}
            credentialsReady={credentialsReady}
            destinationConfigured={nativeEnabled}
            connectionVerified={probe?.reachable === true}
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
