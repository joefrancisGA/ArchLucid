"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmConnectorConnection,
  fetchTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmConnectorConnectionResponse,
  type TenantItsmOutboundSettingsResponse,
  upsertTenantItsmOutboundSettings,
} from "@/lib/api/itsm-outbound-api";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import { isItsmNativeCreateDefaultPathReady } from "@/lib/itsm-native-create-readiness";
import { cn } from "@/lib/utils";

import { ItsmConnectorConnectionSection } from "./ItsmConnectorConnectionSection";
import { ItsmConnectorProbeCard } from "../../_sections/itsm/ItsmConnectorProbeCard";

export function ItsmIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [jiraConnection, setJiraConnection] = useState<TenantItsmConnectorConnectionResponse | null>(null);
  const [serviceNowConnection, setServiceNowConnection] = useState<TenantItsmConnectorConnectionResponse | null>(
    null,
  );
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
      const [healthResponse, settingsResponse, jiraConn, snowConn] = await Promise.all([
        fetchItsmIntegrationHealth(),
        fetchTenantItsmOutboundSettings(),
        fetchTenantItsmConnectorConnection("jira"),
        fetchTenantItsmConnectorConnection("servicenow"),
      ]);
      setHealth(healthResponse);
      applySettings(settingsResponse);
      setJiraConnection(jiraConn);
      setServiceNowConnection(snowConn);
    } catch (error: unknown) {
      setHealth(null);
      applySettings(null);
      setJiraConnection(null);
      setServiceNowConnection(null);
      setLoadError(error instanceof Error ? error.message : "Could not load ITSM configuration.");
    } finally {
      setIsLoading(false);
    }
  }, [applySettings]);

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

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="integrations-itsm-page">
      <LayerHeader pageKey="itsm-connectors" />

      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>Jira &amp; ServiceNow</h1>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>
          Register per-tenant Key Vault secret names and optional outbound routing overrides. ArchLucid never stores raw
          API tokens in SQL — workers resolve secrets at execution time. See{" "}
          <Link href={INTEGRATIONS_READINESS_PATH} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
            Integration readiness
          </Link>{" "}
          for cross-connector status.
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
          <div className="grid gap-4 md:grid-cols-2">
            <ItsmConnectorProbeCard title="Jira" probe={health?.jira} testId="integrations-itsm-jira-health" />
            <ItsmConnectorProbeCard
              title="ServiceNow"
              probe={health?.serviceNow}
              testId="integrations-itsm-servicenow-health"
            />
          </div>

          {defaultPathReady ? (
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="integrations-itsm-default-path-ready">
              Connection validation passed — finding surfaces can offer one-click ITSM sync when native create is enabled.
            </p>
          ) : null}

          <ItsmConnectorConnectionSection
            key={`jira-${jiraConnection?.updatedUtc ?? "empty"}`}
            provider="jira"
            title="Jira connector references"
            summary="Tenant-scoped Jira Cloud instance URL and Key Vault secret names for outbound API tokens and inbound webhook verification."
            connection={jiraConnection}
            canMutate={canMutate}
            onSaved={setJiraConnection}
          />

          <ItsmConnectorConnectionSection
            key={`servicenow-${serviceNowConnection?.updatedUtc ?? "empty"}`}
            provider="servicenow"
            title="ServiceNow connector references"
            summary="Tenant-scoped ServiceNow instance URL and Key Vault secret names for outbound credentials and inbound webhook verification."
            connection={serviceNowConnection}
            canMutate={canMutate}
            onSaved={setServiceNowConnection}
          />

          <Card data-testid="integrations-itsm-settings">
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant outbound overrides</CardTitle>
              <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
                Optional behavioral routing applied during outbound ticket creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError ? (
                <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                  {saveError}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="itsm-jira-project-key">Jira project key override</Label>
                <Input
                  id="itsm-jira-project-key"
                  value={jiraProjectKey}
                  onChange={(event) => setJiraProjectKey(event.target.value)}
                  disabled={!canMutate || isSaving}
                  placeholder="e.g. ARCH"
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="itsm-jira-send-info"
                  checked={jiraSendInfo}
                  onCheckedChange={(checked) => setJiraSendInfo(checked === true)}
                  disabled={!canMutate || isSaving}
                />
                <Label htmlFor="itsm-jira-send-info">Send informational findings to Jira at low priority</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itsm-jira-issue-map">Jira issue type by severity (JSON object)</Label>
                <Textarea
                  id="itsm-jira-issue-map"
                  value={issueTypeJson}
                  onChange={(event) => setIssueTypeJson(event.target.value)}
                  disabled={!canMutate || isSaving}
                  rows={4}
                  placeholder='{"Critical":"Bug","Warning":"Task"}'
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="itsm-snow-auto-cmdb"
                  checked={snowAutoCmdb}
                  onCheckedChange={(checked) => setSnowAutoCmdb(checked === true)}
                  disabled={!canMutate || isSaving}
                />
                <Label htmlFor="itsm-snow-auto-cmdb">Auto-create CMDB CI when lookup misses</Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveSettings()} disabled={!canMutate || isSaving}>
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
                Runs read-only vendor probes for Jira and ServiceNow.
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
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Product-specific pages:{" "}
                <Link href={INTEGRATIONS_JIRA_PATH} className={OPERATOR_LINK.inline}>
                  Jira
                </Link>{" "}
                ·{" "}
                <Link href={INTEGRATIONS_SERVICENOW_PATH} className={OPERATOR_LINK.inline}>
                  ServiceNow
                </Link>
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
