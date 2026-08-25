"use client";

import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";
import { JiraIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { StatusTag } from "@/components/ui/status-tag";
import { useItsmConnectorPage } from "@/hooks/use-itsm-connector-page";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  probeItsmIntegrationHealth,
  upsertTenantItsmOutboundSettings,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { launchJiraAtlassianOAuthConnect } from "@/lib/jira-atlassian-oauth-connect";
import { buildJiraPageLoadResult } from "@/lib/jira-page-load";
import {
  JIRA_CONNECTION_STATUS_HEADING,
  JIRA_INTEGRATION_PAGE_TITLE,
  JIRA_LOADING_MESSAGE,
  JIRA_OAUTH_CONNECT_ERROR,
  JIRA_SAVE_SUCCESS,
  JIRA_SITE_URL_NOT_SET,
} from "@/lib/jira-integration-page-copy";
import {
  formatJiraAuthMethod,
  isJiraAtlassianOAuthConnectReady,
  isJiraCredentialsReady,
  resolveJiraAtlassianOAuthConnectGate,
  resolveJiraConnectionStatus,
  resolveJiraConnectionTestGate,
  resolveJiraCredentialStatusLabel,
  resolveJiraPageComposition,
  sanitizeCustomerFacingJiraProbeSummary,
} from "@/lib/jira-integration-present";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { ItsmNotConfiguredNextStep } from "../../_sections/itsm/ItsmNotConfiguredNextStep";
import { validateJiraIssueTypeBySeverityJson } from "../../_sections/itsm/jira-issue-type-by-severity";
import { JiraConnectionSettingsPanel } from "./JiraConnectionSettingsPanel";
import { JiraConnectionTestPanel } from "./JiraConnectionTestPanel";
import { JiraIntegrationAside } from "./JiraIntegrationAside";
import { JiraIntegrationPageHeader } from "./JiraIntegrationPageHeader";
import { JiraWorkspaceRoutingPanel } from "./JiraWorkspaceRoutingPanel";

export function JiraIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const showOperatorNotes = isShowSystemAdministrationNavEnabled();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraSendInfo, setJiraSendInfo] = useState(false);
  const [issueTypeJson, setIssueTypeJson] = useState("");
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setJiraProjectKey(loaded?.jiraProjectKeyOverride ?? "");
    setJiraSendInfo(loaded?.jiraSendInfoSeverity ?? false);
    setIssueTypeJson(loaded?.jiraIssueTypeBySeverityJson ?? "");
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
    providerId: "jira",
    buildPageLoadResult: buildJiraPageLoadResult,
    applySettings,
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const probe = health?.jira;
  const nativeEnabled = settings?.nativeEnabled ?? health?.nativeEnabled ?? false;
  const credentialsReady = isJiraCredentialsReady(settings, connection, probe);
  const oauthConnectReady = isJiraAtlassianOAuthConnectReady(connection);

  const connectionStatusLoadError =
    healthLoadFailed || connectionLoadFailed ? loadError : null;

  const connectionStatus = useMemo(
    () =>
      resolveJiraConnectionStatus({
        isLoading,
        loadError: connectionStatusLoadError,
        isTesting,
        nativeEnabled,
        credentialsReady,
        oauthConnectReady,
        probe,
      }),
    [connectionStatusLoadError, credentialsReady, isLoading, isTesting, nativeEnabled, oauthConnectReady, probe],
  );

  const testGate = useMemo(
    () =>
      resolveJiraConnectionTestGate({
        nativeEnabled,
        credentialsReady,
        isTesting,
        isSaving,
      }),
    [credentialsReady, isSaving, isTesting, nativeEnabled],
  );

  const connectGate = useMemo(
    () =>
      resolveJiraAtlassianOAuthConnectGate({
        canMutate,
        oauthConnectReady,
        isConnecting,
      }),
    [canMutate, isConnecting, oauthConnectReady],
  );

  const credentialsStateKnown = !healthLoadFailed && health !== null;

  const pageComposition = useMemo(
    () =>
      resolveJiraPageComposition({
        nativeEnabled,
        credentialsReady,
        oauthConnectReady,
        testGateAllowed: testGate.allowed,
        credentialsStateKnown,
      }),
    [credentialsReady, credentialsStateKnown, nativeEnabled, oauthConnectReady, testGate.allowed],
  );

  const workspaceRoutingEditable = canMutate && !settingsLoadFailed && settings !== null && credentialsReady;

  const runConnectionTest = useCallback(async () => {
    if (!testGate.allowed) {
      return;
    }

    setIsTesting(true);
    setTestError(null);

    try {
      const probeResult = await probeItsmIntegrationHealth();
      setHealth(probeResult);
      const jiraProbe = probeResult.jira;
      const summary = sanitizeCustomerFacingJiraProbeSummary(jiraProbe?.summary);
      const success = jiraProbe?.reachable === true;
      setLastTestAt(new Date().toISOString());
      setLastTestSummary(
        success
          ? summary.length > 0
            ? summary
            : "Connection check succeeded."
          : summary.length > 0
            ? summary
            : "Connection check failed. Verify the site URL and OAuth consent.",
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
    if (!workspaceRoutingEditable) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const issueTypeJsonTrimmed = issueTypeJson.trim();
    const issueTypeValidationError = validateJiraIssueTypeBySeverityJson(
      issueTypeJsonTrimmed.length > 0 ? issueTypeJsonTrimmed : "",
    );

    if (issueTypeValidationError !== null) {
      setSaveError(issueTypeValidationError);
      setIsSaving(false);
      return;
    }

    try {
      const saved = await upsertTenantItsmOutboundSettings({
        jiraProjectKeyOverride: jiraProjectKey.trim().length > 0 ? jiraProjectKey.trim() : null,
        jiraSendInfoSeverity: jiraSendInfo,
        jiraIssueTypeBySeverityJson: issueTypeJsonTrimmed.length > 0 ? issueTypeJsonTrimmed : null,
      });
      applySettings(saved);
      setSaveSuccess(JIRA_SAVE_SUCCESS);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save workspace routing settings.");
    } finally {
      setIsSaving(false);
    }
  }, [applySettings, issueTypeJson, jiraProjectKey, jiraSendInfo, workspaceRoutingEditable]);

  const connectWithAtlassian = useCallback(async () => {
    if (!connectGate.allowed || connection === null) {
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      await launchJiraAtlassianOAuthConnect(connection);
    } catch (error: unknown) {
      setConnectError(error instanceof Error ? error.message : JIRA_OAUTH_CONNECT_ERROR);
      setIsConnecting(false);
    }
  }, [connectGate.allowed, connection]);

  const siteUrl = connection?.instanceBaseUrl?.trim() || JIRA_SITE_URL_NOT_SET;
  const authMethod = formatJiraAuthMethod(connection?.authMode);
  const credentialStatus = resolveJiraCredentialStatusLabel(settings, credentialsReady);
  const connectionLabel = connection?.label?.trim();

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-jira-page"
    >
      <JiraIntegrationPageHeader
        connectionStatus={connectionStatus}
        refreshing={isLoading}
        lastCheckedAt={lastCheckedAt}
        onRefresh={() => void refresh()}
        onConnectWithAtlassian={() => void connectWithAtlassian()}
        connectGate={connectGate}
        isConnecting={isConnecting}
      />

      <ItsmConnectorProviderChooserRail currentProviderId="jira" />
      <JiraIntegrationEvidenceOrientationStrip />

      {connectError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert" data-testid="jira-oauth-connect-error">
          {connectError}
        </p>
      ) : null}

      {isLoading && health === null && settings === null ? (
        <OperatorLoadingNotice>{JIRA_LOADING_MESSAGE}</OperatorLoadingNotice>
      ) : (
        <div
          className={cn(OPERATOR_LAYOUT.majorSectionGap)}
          data-operator-side-rail-kind="none"
        >
          <div className={cn("min-w-0", OPERATOR_LAYOUT.sectionStack)} data-testid="jira-page-main">
            {loadError !== null ? (
              <p
                className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
                role="alert"
                data-testid="jira-page-load-error"
              >
                {loadError}
              </p>
            ) : null}

            <section aria-labelledby="jira-status-heading" className="space-y-3" data-testid="jira-connection-status">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="jira-status-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {JIRA_CONNECTION_STATUS_HEADING}
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
                product="jira"
                productTitle={JIRA_INTEGRATION_PAGE_TITLE}
                canConfigureAdmin={canConfigureAdmin}
              />
            ) : null}

            <JiraConnectionSettingsPanel
              siteUrl={siteUrl}
              authMethod={authMethod}
              credentialStatus={credentialStatus}
              connectionLabel={connectionLabel}
            />

            <JiraWorkspaceRoutingPanel
              pageComposition={pageComposition}
              canMutate={canMutate}
              workspaceRoutingEditable={workspaceRoutingEditable}
              settingsLoadFailed={settingsLoadFailed}
              jiraProjectKey={jiraProjectKey}
              onJiraProjectKeyChange={setJiraProjectKey}
              jiraSendInfo={jiraSendInfo}
              onJiraSendInfoChange={setJiraSendInfo}
              issueTypeJson={issueTypeJson}
              onIssueTypeJsonChange={setIssueTypeJson}
              saveError={saveError}
              saveSuccess={saveSuccess}
              isSaving={isSaving}
              isTesting={isTesting}
              onSaveSettings={() => void saveSettings()}
              onRefresh={() => void refresh()}
            />

            <JiraConnectionTestPanel
              pageComposition={pageComposition}
              testGate={testGate}
              testError={testError}
              isTesting={isTesting}
              onRunConnectionTest={() => void runConnectionTest()}
            />
          </div>

          <JiraIntegrationAside
            status={connectionStatus}
            oauthConnectReady={oauthConnectReady}
            credentialsReady={credentialsReady}
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
