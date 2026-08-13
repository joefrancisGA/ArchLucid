"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
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
import {
  DESIGN_TOKENS,
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { launchJiraAtlassianOAuthConnect } from "@/lib/jira-atlassian-oauth-connect";
import { ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED } from "@/lib/itsm/itsm-product-integration-page-copy";
import { ITSM_PRODUCT_SMOKE_VERIFICATION_HREF } from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  JIRA_CONNECTION_SETTINGS_LEAD,
  JIRA_CONNECTION_SETTINGS_TITLE,
  JIRA_CONNECTION_STATUS_HEADING,
  JIRA_CONNECTION_TEST_BUTTON,
  JIRA_CONNECTION_TEST_COLLAPSED_SUMMARY,
  JIRA_CONNECTION_TEST_LEAD,
  JIRA_CONNECTION_TEST_PENDING,
  JIRA_CONNECTION_TEST_TITLE,
  JIRA_CONNECTION_VERIFICATION_HELP_LABEL,
  JIRA_FIELD_AUTH_METHOD,
  JIRA_FIELD_CONNECTION_LABEL,
  JIRA_FIELD_CREDENTIAL_STATUS,
  JIRA_FIELD_SITE_URL,
  JIRA_INTEGRATION_PAGE_TITLE,
  JIRA_LOADING_MESSAGE,
  JIRA_MUTATION_DISABLED_HELPER,
  JIRA_OAUTH_CONNECT_ERROR,
  JIRA_RELOAD_BUTTON,
  JIRA_SAVE_PENDING,
  JIRA_SAVE_SETTINGS_BUTTON,
  JIRA_SAVE_SUCCESS,
  JIRA_SITE_URL_NOT_SET,
  JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY,
  JIRA_WORKSPACE_ROUTING_LEAD,
  JIRA_WORKSPACE_ROUTING_TITLE,
  JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD,
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
  resolveJiraSetupSteps,
  sanitizeCustomerFacingJiraProbeSummary,
} from "@/lib/jira-integration-present";
import { buildJiraPageLoadResult } from "@/lib/jira-page-load";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { ItsmNotConfiguredNextStep } from "../../_sections/itsm/ItsmNotConfiguredNextStep";
import { JiraIssueTypeBySeverityField } from "../../_sections/itsm/JiraIssueTypeBySeverityField";
import { validateJiraIssueTypeBySeverityJson } from "../../_sections/itsm/jira-issue-type-by-severity";
import { JiraIntegrationAside } from "./JiraIntegrationAside";
import { JiraIntegrationPageHeader } from "./JiraIntegrationPageHeader";

export function JiraIntegrationPageClient(): React.ReactElement {
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
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraSendInfo, setJiraSendInfo] = useState(false);
  const [issueTypeJson, setIssueTypeJson] = useState("");
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestSummary, setLastTestSummary] = useState<string | null>(null);
  const [lastTestSuccess, setLastTestSuccess] = useState<boolean | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setSettings(loaded);
    setJiraProjectKey(loaded?.jiraProjectKeyOverride ?? "");
    setJiraSendInfo(loaded?.jiraSendInfoSeverity ?? false);
    setIssueTypeJson(loaded?.jiraIssueTypeBySeverityJson ?? "");
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [healthOutcome, settingsOutcome, connectionOutcome] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchTenantItsmOutboundSettings(),
      fetchTenantItsmConnectorConnection("jira"),
    ]);

    const loaded = buildJiraPageLoadResult({
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
    setLastCheckedAt(new Date());
    setIsLoading(false);
  }, [applySettings]);

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

  const setupSteps = useMemo(
    () =>
      resolveJiraSetupSteps({
        nativeEnabled,
        oauthConnectReady,
        credentialsReady,
        probe,
      }),
    [credentialsReady, nativeEnabled, oauthConnectReady, probe],
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
      const probeResult = await fetchItsmIntegrationHealth();
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
  }, [testGate.allowed]);

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

  const workspaceRoutingBody = (
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
        <Label htmlFor="jira-project-key">Jira project key override</Label>
        <Input
          id="jira-project-key"
          value={jiraProjectKey}
          onChange={(event) => setJiraProjectKey(event.target.value)}
          disabled={isSaving || !workspaceRoutingEditable}
          placeholder="e.g. ARCH"
          autoComplete="off"
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="jira-send-info"
          checked={jiraSendInfo}
          onCheckedChange={(checked) => setJiraSendInfo(checked === true)}
          disabled={isSaving || !workspaceRoutingEditable}
        />
        <Label htmlFor="jira-send-info">Send informational findings to Jira at low priority</Label>
      </div>

      <JiraIssueTypeBySeverityField
        value={issueTypeJson}
        onChange={setIssueTypeJson}
        disabled={isSaving || !workspaceRoutingEditable}
      />

      {settingsLoadFailed ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Workspace routing settings could not be loaded. Reload the page before changing them.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isSaving || !workspaceRoutingEditable}
          title={!canMutate ? enterpriseMutationControlDisabledTitle : undefined}
        >
          {isSaving ? JIRA_SAVE_PENDING : JIRA_SAVE_SETTINGS_BUTTON}
        </Button>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isSaving || isTesting}>
          {JIRA_RELOAD_BUTTON}
        </Button>
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{JIRA_MUTATION_DISABLED_HELPER}</p>
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
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} id="jira-test-disabled-reason">
          {testGate.reason}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => void runConnectionTest()}
        disabled={!testGate.allowed}
        aria-describedby={!testGate.allowed ? "jira-test-disabled-reason" : undefined}
      >
        {isTesting ? JIRA_CONNECTION_TEST_PENDING : JIRA_CONNECTION_TEST_BUTTON}
      </Button>

      <p className="m-0">
        <Link href={ITSM_PRODUCT_SMOKE_VERIFICATION_HREF} className={cn(OPERATOR_LINK.inline)}>
          {JIRA_CONNECTION_VERIFICATION_HELP_LABEL}
        </Link>
      </p>
    </>
  );

  return (
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
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

            <section
              aria-labelledby="jira-connection-settings-heading"
              className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <div>
                <h2 id="jira-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {JIRA_CONNECTION_SETTINGS_TITLE}
                </h2>
                <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {JIRA_CONNECTION_SETTINGS_LEAD}
                </p>
              </div>

              <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_SITE_URL}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-site-url">
                    {siteUrl}
                  </dd>
                </div>
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_AUTH_METHOD}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-auth-method">
                    {authMethod}
                  </dd>
                </div>
                <div>
                  <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_CREDENTIAL_STATUS}</dt>
                  <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-credential-status">
                    {credentialStatus}
                  </dd>
                </div>
                {connectionLabel ? (
                  <div>
                    <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_CONNECTION_LABEL}</dt>
                    <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{connectionLabel}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {pageComposition.workspaceRoutingCollapsed ? (
              <details
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="jira-workspace-routing-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY}
                </summary>
                <div className="mt-3 space-y-3">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD}
                  </p>
                </div>
              </details>
            ) : (
              <section
                aria-labelledby="jira-workspace-routing-heading"
                className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
                data-testid="jira-workspace-routing"
              >
                <div>
                  <h2 id="jira-workspace-routing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {JIRA_WORKSPACE_ROUTING_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {JIRA_WORKSPACE_ROUTING_LEAD}
                  </p>
                </div>

                {workspaceRoutingBody}
              </section>
            )}

            {pageComposition.showConnectionTest ? (
              <section
                aria-labelledby="jira-test-heading"
                className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
                data-testid="jira-connection-test"
              >
                <div>
                  <h2 id="jira-test-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {JIRA_CONNECTION_TEST_TITLE}
                  </h2>
                  <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {JIRA_CONNECTION_TEST_LEAD}
                  </p>
                </div>

                {connectionTestBody}
              </section>
            ) : pageComposition.connectionTestCollapsed ? (
              <details
                className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
                data-testid="jira-connection-test-collapsed"
              >
                <summary
                  className={cn(
                    "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {JIRA_CONNECTION_TEST_COLLAPSED_SUMMARY}
                </summary>
                <div className="mt-3 space-y-3">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED}
                  </p>
                </div>
              </details>
            ) : null}
          </div>

          <JiraIntegrationAside
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
