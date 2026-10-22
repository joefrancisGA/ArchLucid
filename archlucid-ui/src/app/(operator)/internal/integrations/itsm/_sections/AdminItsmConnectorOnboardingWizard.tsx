"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  ITSM_CONNECTOR_SMOKE_HELP,
  ITSM_CONNECTORS_CREDENTIALS_CONFIGURED_HEALTH_FALLBACK,
  ITSM_CONNECTORS_JIRA_CREDENTIALS_NOT_CONFIGURED,
  ITSM_CONNECTORS_SERVICENOW_CREDENTIALS_NOT_CONFIGURED,
  ITSM_CONNECTORS_WIZARD_NATIVE_DISABLED_MESSAGE,
  ITSM_CONNECTORS_WIZARD_PREREQUISITES_DESCRIPTION,
} from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  resolveItsmAdminJiraCredentialsConfigured,
  resolveItsmAdminServiceNowCredentialsConfigured,
} from "@/lib/itsm/itsm-connectors-admin-page-load";
import {
  isItsmNativeCreateDefaultPathReady,
  resolveItsmOnboardingWizardInitialStep,
  type ItsmOnboardingWizardStep,
} from "@/lib/itsm/itsm-native-create-readiness";
import {
  itsmOnboardingWizardStepHrefFromSearch,
  parseItsmOnboardingWizardStepFromSearch,
} from "@/lib/itsm/itsm-onboarding-wizard-step-url";

type Props = {
  readonly initialSettings: TenantItsmOutboundSettingsResponse | null;
  readonly initialHealth: ItsmIntegrationHealthResponse | null;
  readonly settingsLoadFailed?: boolean;
  readonly onSettingsSaved: (settings: TenantItsmOutboundSettingsResponse) => void;
  readonly onHealthUpdated: (health: ItsmIntegrationHealthResponse) => void;
};

const STEPS: readonly { id: ItsmOnboardingWizardStep; label: string }[] = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "settings", label: "Tenant overrides" },
  { id: "verify", label: "Connection test" },
  { id: "runbooks", label: "Smoke runbooks" },
];

export function AdminItsmConnectorOnboardingWizard(props: Props): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/internal/integrations/itsm";
  const searchParams = useSearchParams();
  const urlStep = parseItsmOnboardingWizardStepFromSearch(searchParams.get("itsmStep"));
  const [step, setStepState] = useState<ItsmOnboardingWizardStep>(() =>
    urlStep ?? resolveItsmOnboardingWizardInitialStep(props.initialHealth, props.initialSettings),
  );

  const syncStepToUrl = useCallback(
    (nextStep: ItsmOnboardingWizardStep) => {
      router.replace(itsmOnboardingWizardStepHrefFromSearch(searchParams.toString(), nextStep, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setStep = useCallback(
    (nextStep: ItsmOnboardingWizardStep) => {
      setStepState(nextStep);
      syncStepToUrl(nextStep);
    },
    [syncStepToUrl],
  );

  useEffect(() => {
    const fromUrl = parseItsmOnboardingWizardStepFromSearch(searchParams.get("itsmStep"));

    if (fromUrl !== null) {
      setStepState(fromUrl);
    }
  }, [searchParams]);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(props.initialSettings);
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(props.initialHealth);
  const [jiraProjectKey, setJiraProjectKey] = useState(props.initialSettings?.jiraProjectKeyOverride ?? "");
  const [jiraSendInfo, setJiraSendInfo] = useState(props.initialSettings?.jiraSendInfoSeverity ?? false);
  const [issueTypeJson, setIssueTypeJson] = useState(props.initialSettings?.jiraIssueTypeBySeverityJson ?? "");
  const [snowAutoCmdb, setSnowAutoCmdb] = useState(props.initialSettings?.serviceNowAutoCreateCmdbCi ?? false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const nativeEnabled = settings?.nativeEnabled ?? health?.nativeEnabled ?? false;
  const defaultPathReady = isItsmNativeCreateDefaultPathReady(health);
  const settingsLoadFailed = props.settingsLoadFailed === true;
  const jiraCredentialsConfigured = resolveItsmAdminJiraCredentialsConfigured(settings, health, settingsLoadFailed);
  const serviceNowCredentialsConfigured = resolveItsmAdminServiceNowCredentialsConfigured(
    settings,
    health,
    settingsLoadFailed,
  );

  const reloadSettings = useCallback(async () => {
    const loaded = await fetchTenantItsmOutboundSettings();
    setSettings(loaded);
    setJiraProjectKey(loaded.jiraProjectKeyOverride ?? "");
    setJiraSendInfo(loaded.jiraSendInfoSeverity ?? false);
    setIssueTypeJson(loaded.jiraIssueTypeBySeverityJson ?? "");
    setSnowAutoCmdb(loaded.serviceNowAutoCreateCmdbCi ?? false);
    props.onSettingsSaved(loaded);
  }, [props]);

  const runConnectionTest = useCallback(async () => {
    setIsTesting(true);
    setTestError(null);

    try {
      const probe = await fetchItsmIntegrationHealth();
      setHealth(probe);
      props.onHealthUpdated(probe);
    } catch (error: unknown) {
      setTestError(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setIsTesting(false);
    }
  }, [props]);

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
      setSettings(saved);
      props.onSettingsSaved(saved);
      setStep("verify");
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save tenant ITSM settings.");
    } finally {
      setIsSaving(false);
    }
  }, [issueTypeJson, jiraProjectKey, jiraSendInfo, props, snowAutoCmdb]);

  return (
    <section className="space-y-4" aria-labelledby="admin-itsm-onboarding-heading" data-testid="admin-itsm-onboarding-wizard">
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2 id="admin-itsm-onboarding-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          Onboarding wizard
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Configure tenant overrides, validate live connectivity, and follow smoke runbooks before enabling native outbound create.
        </p>
        {defaultPathReady ? (
          <p
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="admin-itsm-default-path-ready"
          >
            Native one-click create is validated for this tenant — finding surfaces will offer Jira/ServiceNow sync as the
            default handoff path.
          </p>
        ) : null}
      </div>

      <nav aria-label="ITSM onboarding steps" className="flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={step === item.id ? "default" : "outline"}
            onClick={() => setStep(item.id)}
            data-testid={`admin-itsm-step-${item.id}`}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {step === "prerequisites" ? (
        <Card data-testid="admin-itsm-step-panel-prerequisites">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Deployment prerequisites</CardTitle>
            <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
              {ITSM_CONNECTORS_WIZARD_PREREQUISITES_DESCRIPTION}
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-al-text-primary">Native outbound create</span>
              <StatusTag kind={nativeEnabled ? "ready" : "neutral"} label={nativeEnabled ? "Enabled" : "Disabled"} />
            </div>
            {!nativeEnabled ? (
              <p className="m-0 text-al-text-secondary">{ITSM_CONNECTORS_WIZARD_NATIVE_DISABLED_MESSAGE}</p>
            ) : null}

            <div className="space-y-2 rounded-md border border-al-border-subtle p-3">
              <p className="m-0 font-medium text-al-text-primary">Masked deployment credentials</p>
              <ul className="m-0 list-disc space-y-1 pl-5 text-al-text-secondary">
                <li>
                  Jira:{" "}
                  {jiraCredentialsConfigured ? (
                    settings?.deploymentCredentials?.jiraConfigured === true ? (
                      <>
                        configured — service account{" "}
                        <span className="font-mono">
                          {settings.deploymentCredentials.jiraServiceAccountEmailMasked ?? "••••"}
                        </span>
                      </>
                    ) : (
                      ITSM_CONNECTORS_CREDENTIALS_CONFIGURED_HEALTH_FALLBACK
                    )
                  ) : (
                    ITSM_CONNECTORS_JIRA_CREDENTIALS_NOT_CONFIGURED
                  )}
                </li>
                <li>
                  ServiceNow:{" "}
                  {serviceNowCredentialsConfigured ? (
                    settings?.deploymentCredentials?.serviceNowConfigured === true ? (
                      <>
                        configured — username{" "}
                        <span className="font-mono">
                          {settings.deploymentCredentials.serviceNowUsernameMasked ?? "••••"}
                        </span>
                      </>
                    ) : (
                      ITSM_CONNECTORS_CREDENTIALS_CONFIGURED_HEALTH_FALLBACK
                    )
                  ) : (
                    ITSM_CONNECTORS_SERVICENOW_CREDENTIALS_NOT_CONFIGURED
                  )}
                </li>
              </ul>
            </div>

            <Button type="button" onClick={() => setStep("settings")}>
              Continue to tenant overrides
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === "settings" ? (
        <Card data-testid="admin-itsm-step-panel-settings">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Tenant outbound overrides</CardTitle>
            <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
              Optional per-tenant routing for Jira project key, severity filters, and ServiceNow CMDB posture.
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
                disabled={isSaving}
                placeholder="e.g. ARCH"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="itsm-jira-send-info"
                checked={jiraSendInfo}
                onCheckedChange={(checked) => setJiraSendInfo(checked === true)}
                disabled={isSaving}
              />
              <Label htmlFor="itsm-jira-send-info">Send informational findings to Jira at low priority</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itsm-jira-issue-map">Jira issue type by severity (JSON object)</Label>
              <Textarea
                id="itsm-jira-issue-map"
                value={issueTypeJson}
                onChange={(event) => setIssueTypeJson(event.target.value)}
                disabled={isSaving}
                rows={4}
                placeholder='{"Critical":"Bug","Warning":"Task"}'
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="itsm-snow-cmdb"
                checked={snowAutoCmdb}
                onCheckedChange={(checked) => setSnowAutoCmdb(checked === true)}
                disabled={isSaving}
              />
              <Label htmlFor="itsm-snow-cmdb">ServiceNow: auto-create CMDB CI when lookup misses</Label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveSettings()} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save tenant settings"}
              </Button>
              <Button type="button" variant="outline" onClick={() => void reloadSettings()} disabled={isSaving}>
                Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "verify" ? (
        <Card data-testid="admin-itsm-step-panel-verify">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Connection test</CardTitle>
            <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
              Runs read-only vendor probes (Jira <code className={OPERATOR_TYPOGRAPHY.micro}>/rest/api/3/myself</code>, ServiceNow table sample).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testError ? (
              <p className="m-0 text-red-600 dark:text-red-400" role="alert">
                {testError}
              </p>
            ) : null}

            <Button type="button" onClick={() => void runConnectionTest()} disabled={isTesting} data-testid="admin-itsm-test-connection">
              {isTesting ? "Testing…" : "Run connection test"}
            </Button>

            {health ? (
              <ul className="m-0 list-none space-y-2 p-0">
                <li className="rounded-md border border-al-border-subtle p-3 text-al-text-secondary">
                  <span className="font-medium text-al-text-primary">Jira:</span> {health.jira?.summary ?? " — "}
                </li>
                <li className="rounded-md border border-al-border-subtle p-3 text-al-text-secondary">
                  <span className="font-medium text-al-text-primary">ServiceNow:</span> {health.serviceNow?.summary ?? " — "}
                </li>
              </ul>
            ) : null}

            <Button type="button" variant="outline" onClick={() => setStep("runbooks")}>
              Continue to smoke runbooks
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === "runbooks" ? (
        <Card data-testid="admin-itsm-step-panel-runbooks">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Smoke runbooks</CardTitle>
            <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
              Validate outbound create and inbound webhook sync before promoting native create in production pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
            <p className="m-0">
              <Link href={ITSM_CONNECTOR_SMOKE_HELP.jira} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
                Jira connector smoke checklist
              </Link>
            </p>
            <p className="m-0">
              <Link
                href={ITSM_CONNECTOR_SMOKE_HELP.serviceNow}
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
                ServiceNow connector smoke checklist
              </Link>
            </p>
            <p className="m-0">
              <Link
                href={ITSM_CONNECTOR_SMOKE_HELP.scaffold}
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
                ITSM live smoke scaffold
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
