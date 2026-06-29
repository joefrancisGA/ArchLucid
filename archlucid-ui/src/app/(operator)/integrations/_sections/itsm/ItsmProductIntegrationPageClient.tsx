"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmOutboundSettings,
  upsertTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ITSM_CONNECTOR_SMOKE_HELP } from "@/lib/itsm-connectors-admin-scope";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm-native-create-readiness";

import { ItsmConnectorProbeCard } from "./ItsmConnectorProbeCard";

export type ItsmProductId = "jira" | "servicenow";

type Props = {
  readonly product: ItsmProductId;
};

const PRODUCT_COPY: Record<
  ItsmProductId,
  {
    pageTitle: string;
    summary: string;
    readinessLabel: string;
    smokeHelpHref: string;
    smokeHelpLabel: string;
  }
> = {
  jira: {
    pageTitle: "Jira",
    summary:
      "Configure Jira Cloud outbound ticket creation from architecture findings. Per-tenant connector references live on the unified ITSM page — deployment credentials remain a single-tenant pilot fallback.",
    readinessLabel: "Jira",
    smokeHelpHref: ITSM_CONNECTOR_SMOKE_HELP.jira,
    smokeHelpLabel: "Jira connector smoke checklist",
  },
  servicenow: {
    pageTitle: "ServiceNow",
    summary:
      "Configure ServiceNow outbound incident creation from architecture findings. Per-tenant connector references live on the unified ITSM page — deployment credentials remain a single-tenant pilot fallback.",
    readinessLabel: "ServiceNow",
    smokeHelpHref: ITSM_CONNECTOR_SMOKE_HELP.serviceNow,
    smokeHelpLabel: "ServiceNow connector smoke checklist",
  },
};

export function ItsmProductIntegrationPageClient(props: Props): React.ReactElement {
  const copy = PRODUCT_COPY[props.product];
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraSendInfo, setJiraSendInfo] = useState(false);
  const [issueTypeJson, setIssueTypeJson] = useState("");
  const [snowAutoCmdb, setSnowAutoCmdb] = useState(false);

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

  const nativeEnabled = settings?.nativeEnabled ?? health?.nativeEnabled ?? false;
  const defaultPathReady = isItsmNativeCreateDefaultPathReady(health);

  const runConnectionTest = useCallback(async () => {
    setIsTesting(true);
    setTestError(null);

    try {
      const probe = await fetchItsmIntegrationHealth();
      setHealth(probe);
    } catch (error: unknown) {
      setTestError(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setIsTesting(false);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const saved = await upsertTenantItsmOutboundSettings({
        jiraProjectKeyOverride: jiraProjectKey.trim().length > 0 ? jiraProjectKey.trim() : null,
        jiraSendInfoSeverity: jiraSendInfo,
        jiraIssueTypeBySeverityJson: issueTypeJson.trim().length > 0 ? issueTypeJson.trim() : null,
        serviceNowAutoCreateCmdbCi: snowAutoCmdb,
      });
      applySettings(saved);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save tenant settings.");
    } finally {
      setIsSaving(false);
    }
  }, [applySettings, issueTypeJson, jiraProjectKey, jiraSendInfo, snowAutoCmdb]);

  const probe =
    props.product === "jira" ? health?.jira : health?.serviceNow;

  return (
    <div
      className="w-full max-w-3xl space-y-6"
      data-testid={`integrations-${props.product}-page`}
    >
      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{copy.pageTitle}</h1>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>{copy.summary}</p>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.helper}`}>
          See{" "}
          <Link
            href={INTEGRATIONS_READINESS_PATH}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
          >
            Integration readiness
          </Link>{" "}
          for cross-integration status across {copy.readinessLabel}, Teams, Slack, Azure, and webhooks.
        </p>
      </header>

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

          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Deployment prerequisites</CardTitle>
              <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
                Outbound credentials remain in host configuration or Key Vault materialization — never stored in tenant SQL.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-al-text-primary">Native outbound create</span>
                <StatusTag kind={nativeEnabled ? "ready" : "neutral"} label={nativeEnabled ? "Enabled" : "Disabled"} />
              </div>
              {defaultPathReady ? (
                <p className="m-0 text-al-text-primary">
                  Connection validation passed — finding surfaces can offer one-click {copy.pageTitle} sync when native
                  create is enabled.
                </p>
              ) : null}
              {props.product === "jira" ? (
                <p className="m-0 text-al-text-secondary">
                  Jira deployment credentials:{" "}
                  {settings?.deploymentCredentials?.jiraConfigured ? (
                    <>
                      configured — service account{" "}
                      <span className="font-mono">{settings.deploymentCredentials.jiraServiceAccountEmailMasked ?? "••••"}</span>
                    </>
                  ) : (
                    "not configured — add Integrations:ItsmOutbound:Jira credentials in host configuration"
                  )}
                </p>
              ) : (
                <p className="m-0 text-al-text-secondary">
                  ServiceNow deployment credentials:{" "}
                  {settings?.deploymentCredentials?.serviceNowConfigured ? (
                    <>
                      configured — username{" "}
                      <span className="font-mono">{settings.deploymentCredentials.serviceNowUsernameMasked ?? "••••"}</span>
                    </>
                  ) : (
                    "not configured — add Integrations:ItsmOutbound:ServiceNow credentials in host configuration"
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid={`integrations-${props.product}-settings`}>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant overrides</CardTitle>
              <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
                Optional per-tenant routing for {copy.pageTitle}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      disabled={isSaving}
                      placeholder="e.g. ARCH"
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="jira-send-info"
                      checked={jiraSendInfo}
                      onCheckedChange={(checked) => setJiraSendInfo(checked === true)}
                      disabled={isSaving}
                    />
                    <Label htmlFor="jira-send-info">Send informational findings to Jira at low priority</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jira-issue-map">Jira issue type by severity (JSON object)</Label>
                    <Textarea
                      id="jira-issue-map"
                      value={issueTypeJson}
                      onChange={(event) => setIssueTypeJson(event.target.value)}
                      disabled={isSaving}
                      rows={4}
                      placeholder='{"Critical":"Bug","Warning":"Task"}'
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="snow-auto-cmdb"
                    checked={snowAutoCmdb}
                    onCheckedChange={(checked) => setSnowAutoCmdb(checked === true)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="snow-auto-cmdb">Auto-create CMDB CI when lookup misses</Label>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveSettings()} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save tenant settings"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isSaving}>
                  Reload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Connection test</CardTitle>
              <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
                Runs read-only vendor probes for {copy.pageTitle}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testError ? (
                <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                  {testError}
                </p>
              ) : null}
              <Button type="button" onClick={() => void runConnectionTest()} disabled={isTesting}>
                {isTesting ? "Testing…" : "Run connection test"}
              </Button>
              {probe?.summary ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{probe.summary}</p>
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
