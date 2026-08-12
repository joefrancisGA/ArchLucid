"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ItsmConnectorProviderChooserRail } from "@/components/itsm/ItsmConnectorProviderChooserRail";
import { ItsmConnectorsBuyerJiraServicenowVocabularyRail } from "@/components/itsm/ItsmConnectorsBuyerJiraServicenowVocabularyRail";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmOutboundSettings,
  upsertTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { DESIGN_TOKENS, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import {
  formatItsmConnectionTestResult,
  formatItsmNativeCreateReadyMessage,
  ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED,
  ITSM_INTEGRATION_READINESS_AFTER_LINK,
  ITSM_PLATFORM_OPERATOR_NOTES_BODY,
  ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY,
  ITSM_PRODUCT_PAGE_COPY,
  ITSM_TENANT_OVERRIDES_COLLAPSED_SUMMARY,
  ITSM_TENANT_OVERRIDES_UNAVAILABLE_LEAD,
  sanitizeItsmCustomerFacingProbeSummary,
  type ItsmProductId,
} from "@/lib/itsm/itsm-product-integration-page-copy";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm/itsm-native-create-readiness";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { useOperateCapability } from "@/hooks/use-operate-capability";

import { ItsmConnectorProbeCard } from "./ItsmConnectorProbeCard";
import { ItsmNotConfiguredNextStep } from "./ItsmNotConfiguredNextStep";
import { JiraIssueTypeBySeverityField } from "./JiraIssueTypeBySeverityField";
import { validateJiraIssueTypeBySeverityJson } from "./jira-issue-type-by-severity";
type Props = {
  readonly product: ItsmProductId;
};

export function ItsmProductIntegrationPageClient(props: Props): React.ReactElement {
  const canMutate = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canConfigureAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const copy = ITSM_PRODUCT_PAGE_COPY[props.product];
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionTestSummary, setConnectionTestSummary] = useState<string | null>(null);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraSendInfo, setJiraSendInfo] = useState(false);
  const [issueTypeJson, setIssueTypeJson] = useState("");
  const [snowAutoCmdb, setSnowAutoCmdb] = useState(false);
  const [operatorNotesOpen, setOperatorNotesOpen] = useState(false);
  const operatorNotesSeededRef = useRef(false);

  const applySettings = useCallback((loaded: TenantItsmOutboundSettingsResponse | null) => {
    setSettings(loaded);
    setJiraProjectKey(loaded?.jiraProjectKeyOverride ?? "");
    setJiraSendInfo(loaded?.jiraSendInfoSeverity ?? false);
    setIssueTypeJson(loaded?.jiraIssueTypeBySeverityJson ?? "");
    setSnowAutoCmdb(loaded?.serviceNowAutoCreateCmdbCi ?? false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setConnectionTestSummary(null);

    try {
      const [healthResponse, settingsResponse] = await Promise.all([
        fetchItsmIntegrationHealth(),
        fetchTenantItsmOutboundSettings(),
      ]);
      setHealth(healthResponse);
      applySettings(settingsResponse);
    } catch (error: unknown) {
      setHealth(null);
      applySettings(null);
      setLoadError(error instanceof Error ? error.message : `Could not load ${copy.pageTitle} configuration.`);
    } finally {
      setIsLoading(false);
    }
  }, [applySettings, copy.pageTitle]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const defaultPathReady = isItsmNativeCreateDefaultPathReady(health);

  const runConnectionTest = useCallback(async () => {
    setIsTesting(true);
    setTestError(null);

    try {
      const probe = await fetchItsmIntegrationHealth();
      setHealth(probe);
      const rawProbe = props.product === "jira" ? probe.jira : probe.serviceNow;
      setConnectionTestSummary(
        formatItsmConnectionTestResult(
          props.product,
          rawProbe == null
            ? null
            : {
                locallyConfigured: rawProbe.locallyConfigured ?? false,
                reachable: rawProbe.reachable ?? null,
                summary: rawProbe.summary ?? "",
              },
        ),
      );
    } catch (error: unknown) {
      setTestError(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setIsTesting(false);
    }
  }, [props.product]);

  const saveSettings = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

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
        serviceNowAutoCreateCmdbCi: snowAutoCmdb,
      });
      applySettings(saved);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save tenant settings.");
    } finally {
      setIsSaving(false);
    }
  }, [applySettings, canMutate, issueTypeJson, jiraProjectKey, jiraSendInfo, snowAutoCmdb]);

  const rawProbe =
    props.product === "jira" ? health?.jira : health?.serviceNow;
  const probe =
    rawProbe === null || rawProbe === undefined
      ? rawProbe
      : {
          ...rawProbe,
          summary: sanitizeItsmCustomerFacingProbeSummary(rawProbe.summary, props.product),
        };
  const locallyConfigured = probe?.locallyConfigured === true;
  // Only claim "not configured" after a successful health load (TB-1146 / Bugbot).
  const showNotConfiguredNextStep = health !== null && !locallyConfigured;
  const overridesInteractionDisabled = showNotConfiguredNextStep || isSaving;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (health === null) {
      operatorNotesSeededRef.current = false;
      return;
    }

    if (!operatorNotesSeededRef.current) {
      setOperatorNotesOpen(showNotConfiguredNextStep);
      operatorNotesSeededRef.current = true;
    }
  }, [health, isLoading, showNotConfiguredNextStep]);

  const tenantOverrideFields = (
    <>
      {saveError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}

      {props.product === "jira" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="jira-project-key">Jira project key override</Label>
            <Input
              id="jira-project-key"
              value={jiraProjectKey}
              onChange={(event) => setJiraProjectKey(event.target.value)}
              disabled={overridesInteractionDisabled}
              placeholder="e.g. ARCH"
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="jira-send-info"
              checked={jiraSendInfo}
              onCheckedChange={(checked) => setJiraSendInfo(checked === true)}
              disabled={overridesInteractionDisabled}
            />
            <Label htmlFor="jira-send-info">Send informational findings to Jira at low priority</Label>
          </div>
          <JiraIssueTypeBySeverityField
            value={issueTypeJson}
            onChange={setIssueTypeJson}
            disabled={overridesInteractionDisabled}
          />
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Checkbox
            id="snow-auto-cmdb"
            checked={snowAutoCmdb}
            onCheckedChange={(checked) => setSnowAutoCmdb(checked === true)}
            disabled={overridesInteractionDisabled}
          />
          <Label htmlFor="snow-auto-cmdb">Auto-create CMDB CI when lookup misses</Label>
        </div>
      )}
    </>
  );

  const tenantOverrideActions = (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={showNotConfiguredNextStep ? "outline" : "default"}
          onClick={() => void saveSettings()}
          disabled={overridesInteractionDisabled || !canMutate}
          title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
        >
          {isSaving ? "Saving…" : "Save tenant settings"}
        </Button>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isSaving}>
          Reload
        </Button>
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Elevated workspace permissions required to save tenant settings.
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className="w-full max-w-3xl space-y-6"
      data-testid={`integrations-${props.product}-page`}
    >
      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{copy.pageTitle}</h1>
          {props.product === "jira" ? <PageContextualHelpButton /> : null}
        </div>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.helper}`}>{copy.summary}</p>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.helper}`}>
          See{" "}
          <Link
            href={INTEGRATIONS_READINESS_PATH}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
          >
            Integration readiness
          </Link>{" "}
          {ITSM_INTEGRATION_READINESS_AFTER_LINK}
        </p>
      </header>

      {props.product === "jira" ? (
        <ItsmConnectorsBuyerJiraServicenowVocabularyRail currentSurfaceId="jira" />
      ) : null}

      <ItsmConnectorProviderChooserRail
        currentProviderId={props.product === "jira" ? "jira" : "servicenow"}
      />

{loadError ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading configuration…</p>
      ) : (
        <>
          <ItsmConnectorProbeCard
            title={copy.pageTitle}
            probe={probe}
            testId={`integrations-${props.product}-health`}
          />

          {showNotConfiguredNextStep ? (
            <ItsmNotConfiguredNextStep
              product={props.product}
              productTitle={copy.pageTitle}
              canConfigureAdmin={canConfigureAdmin}
            />
          ) : null}

          {defaultPathReady ? (
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {formatItsmNativeCreateReadyMessage(copy.pageTitle)}
            </p>
          ) : null}

          <details
            className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid={`integrations-${props.product}-operator-notes`}
            open={operatorNotesOpen}
            onToggle={(event) => setOperatorNotesOpen(event.currentTarget.open)}
          >
            <summary
              className={cn(
                "cursor-pointer select-none px-3 py-2 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                OPERATOR_DISCLOSURE_TRIGGER_CLASS,
              )}
            >
              {ITSM_PLATFORM_OPERATOR_NOTES_SUMMARY}
            </summary>
            <div className={cn("border-t border-neutral-200 px-3 py-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0 text-al-text-secondary">{ITSM_PLATFORM_OPERATOR_NOTES_BODY}</p>
            </div>
          </details>

          <Card data-testid={`integrations-${props.product}-settings`}>
            {showNotConfiguredNextStep ? (
              <details data-testid={`integrations-${props.product}-settings-collapsed`}>
                <summary
                  className={cn(
                    "cursor-pointer select-none px-6 py-4 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                    OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                  )}
                >
                  {ITSM_TENANT_OVERRIDES_COLLAPSED_SUMMARY}
                </summary>
                <CardContent className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {ITSM_TENANT_OVERRIDES_UNAVAILABLE_LEAD}
                  </p>
                  {tenantOverrideFields}
                  {tenantOverrideActions}
                </CardContent>
              </details>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant overrides</CardTitle>
                  <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
                    Optional per-tenant routing for {copy.pageTitle}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tenantOverrideFields}
                  {tenantOverrideActions}
                </CardContent>
              </>
            )}
          </Card>

          <Card data-testid={`integrations-${props.product}-connection-test`}>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Connection test</CardTitle>
              <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>{copy.connectionTestLead}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testError ? (
                <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                  {testError}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => void runConnectionTest()}
                disabled={isTesting || showNotConfiguredNextStep}
              >
                {isTesting ? "Testing…" : "Run connection test"}
              </Button>
              {connectionTestSummary ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{connectionTestSummary}</p>
              ) : showNotConfiguredNextStep ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {ITSM_CONNECTION_TEST_UNAVAILABLE_UNTIL_CONFIGURED}
                </p>
              ) : null}
              <p className="m-0">
                <Link
                  href={copy.smokeHelpHref}
                  className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                >
                  {copy.smokeHelpLabel}
                </Link>
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
