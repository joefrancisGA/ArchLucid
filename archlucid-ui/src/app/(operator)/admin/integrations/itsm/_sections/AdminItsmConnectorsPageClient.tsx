"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import {
  ITSM_CONNECTORS_ADMIN_LABEL,
  ITSM_CONNECTORS_ADMIN_SUMMARY,
} from "@/lib/itsm-connectors-admin-scope";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { AdminItsmConnectorOnboardingWizard } from "./AdminItsmConnectorOnboardingWizard";

type ConnectorProbeCardProps = {
  title: string;
  probe: ItsmIntegrationHealthResponse["jira"] | ItsmIntegrationHealthResponse["serviceNow"];
  testId: string;
};

function ConnectorProbeCard(props: ConnectorProbeCardProps): React.ReactElement {
  const { title, probe, testId } = props;
  const summary = (probe?.summary ?? "Health probe not available.").trim();
  const configured = probe?.locallyConfigured === true;
  const reachable = probe?.reachable;

  let statusLabel = "Not configured";

  if (configured && reachable === true) {
    statusLabel = "Ready";
  } else if (configured) {
    statusLabel = "Configured";
  }

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{title}</CardTitle>
          <StatusTag kind={configured ? "ready" : "neutral"} label={statusLabel} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{summary}</p>
      </CardContent>
    </Card>
  );
}

export function AdminItsmConnectorsPageClient(): React.ReactElement {
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [healthResponse, settingsResponse] = await Promise.all([
        fetchItsmIntegrationHealth(),
        fetchTenantItsmOutboundSettings(),
      ]);
      setHealth(healthResponse);
      setSettings(settingsResponse);
    } catch (error: unknown) {
      setHealth(null);
      setSettings(null);
      setLoadError(error instanceof Error ? error.message : "Could not load ITSM connector configuration.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="admin-itsm-connectors-page">
      <header className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{ITSM_CONNECTORS_ADMIN_LABEL}</h1>
        <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.meta}`}>{ITSM_CONNECTORS_ADMIN_SUMMARY}</p>
      </header>

      <Card data-testid="admin-itsm-connectors-scope">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>V1 scope</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            Jira and ServiceNow connectors ship in V1 for internal rollout. Buyer-facing{" "}
            <Link
              href="/integrations/operations"
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              Integration readiness
            </Link>{" "}
            shows status only; configure connectors here. Copy-for-Jira and CSV export remain on findings surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {health?.nativeEnabled === true ? (
            <p className="m-0">Native outbound create is enabled for this deployment.</p>
          ) : (
            <p className="m-0">
              Native outbound create is disabled for this deployment (clipboard export still available). Enable{" "}
              <code className={OPERATOR_TYPOGRAPHY.micro}>Integrations:Itsm:NativeEnabled</code> after smoke validation.
            </p>
          )}
          {settings?.hasTenantOverrides ? (
            <p className="m-0">Tenant ITSM outbound overrides are saved for this tenant.</p>
          ) : (
            <p className="m-0">No tenant overrides saved yet — use the onboarding wizard below.</p>
          )}
        </CardContent>
      </Card>

      {loadError ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading connector configuration…</p>
      ) : (
        <>
          <AdminItsmConnectorOnboardingWizard
            initialSettings={settings}
            initialHealth={health}
            onSettingsSaved={setSettings}
            onHealthUpdated={setHealth}
          />

          <section className="space-y-4" aria-labelledby="admin-itsm-connectors-health-heading">
            <h2
              id="admin-itsm-connectors-health-heading"
              className={OPERATOR_TYPOGRAPHY.sectionTitle}
            >
              Connector health
            </h2>
            <ConnectorProbeCard title="Jira" probe={health?.jira} testId="admin-itsm-jira-health" />
            <ConnectorProbeCard title="ServiceNow" probe={health?.serviceNow} testId="admin-itsm-servicenow-health" />
          </section>
        </>
      )}
    </div>
  );
}
