"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Workflow } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchItsmIntegrationHealth,
  fetchTenantItsmOutboundSettings,
  type ItsmIntegrationHealthResponse,
  type TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";
import {
  ITSM_CONNECTORS_ADMIN_LABEL,
  ITSM_CONNECTORS_ADMIN_PATH,
  ITSM_CONNECTORS_ADMIN_SUMMARY,
  ITSM_CONNECTORS_NATIVE_DISABLED_MESSAGE,
  ITSM_CONNECTORS_NATIVE_ENABLED_MESSAGE,
  ITSM_CONNECTORS_PAGE_CONFIG_CARD_TITLE,
} from "@/lib/itsm-connectors-admin-scope";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AdminItsmConnectorOnboardingWizard } from "./AdminItsmConnectorOnboardingWizard";
import { ItsmConnectorProbeCard } from "@/app/(operator)/integrations/_sections/itsm/ItsmConnectorProbeCard";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";

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
      <PageHeading
        navHref={ITSM_CONNECTORS_ADMIN_PATH}
        title={ITSM_CONNECTORS_ADMIN_LABEL}
        description={ITSM_CONNECTORS_ADMIN_SUMMARY}
        icon={Workflow}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        data-testid="admin-itsm-connectors-page-heading"
      />

      <Card data-testid="admin-itsm-connectors-scope">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{ITSM_CONNECTORS_PAGE_CONFIG_CARD_TITLE}</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            Buyer-facing{" "}
            <Link
              href={INTEGRATIONS_READINESS_PATH}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              Integration readiness
            </Link>
            ,{" "}
            <Link href={INTEGRATIONS_JIRA_PATH} className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
              Jira
            </Link>
            , and{" "}
            <Link
              href={INTEGRATIONS_SERVICENOW_PATH}
              className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              ServiceNow
            </Link>{" "}
            pages configure each product separately. Copy-for-Jira and CSV export remain on findings surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {health?.nativeEnabled === true ? (
            <p className="m-0">{ITSM_CONNECTORS_NATIVE_ENABLED_MESSAGE}</p>
          ) : (
            <p className="m-0">{ITSM_CONNECTORS_NATIVE_DISABLED_MESSAGE}</p>
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
            <ItsmConnectorProbeCard title="Jira" probe={health?.jira} testId="admin-itsm-jira-health" />
            <ItsmConnectorProbeCard title="ServiceNow" probe={health?.serviceNow} testId="admin-itsm-servicenow-health" />
          </section>
        </>
      )}
    </div>
  );
}
