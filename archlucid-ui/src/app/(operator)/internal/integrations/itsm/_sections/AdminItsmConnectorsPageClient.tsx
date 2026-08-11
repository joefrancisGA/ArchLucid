"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Workflow } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { FindingCorrelationVocabularyDisambiguation } from "@/components/FindingCorrelationVocabularyDisambiguation";
import { ItsmConnectorsBuyerJiraServicenowVocabularyRail } from "@/components/ItsmConnectorsBuyerJiraServicenowVocabularyRail";
import { ItsmConnectorsFindingTicketVocabularyRail } from "@/components/ItsmConnectorsFindingTicketVocabularyRail";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
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
import { AdminItsmConnectorsPageLoadingSkeleton } from "./AdminItsmConnectorsPageLoadingSkeleton";
import { ItsmConnectorProbeCard } from "@/app/(operator)/integrations/_sections/itsm/ItsmConnectorProbeCard";
import {
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_READINESS_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
} from "@/lib/integrations-nav-paths";
import {
  buildItsmConnectorsAdminPageLoadResult,
  sanitizeItsmConnectorsAdminLoadError,
} from "@/lib/itsm-connectors-admin-page-load";

export function AdminItsmConnectorsPageClient(): React.ReactElement {
  const [health, setHealth] = useState<ItsmIntegrationHealthResponse | null>(null);
  const [settings, setSettings] = useState<TenantItsmOutboundSettingsResponse | null>(null);
  const [healthLoadError, setHealthLoadError] = useState<string | null>(null);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const nativeEnabled = health?.nativeEnabled ?? settings?.nativeEnabled ?? false;
  const hasLoadErrors = healthLoadError !== null || settingsLoadError !== null;
  const showLoadingSkeleton = isLoading && health === null && settings === null;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setHealthLoadError(null);
    setSettingsLoadError(null);

    // Isolate slice failures so one 500 cannot wipe successful health/settings (TB-1431).
    const [healthOutcome, settingsOutcome] = await Promise.allSettled([
      fetchItsmIntegrationHealth(),
      fetchTenantItsmOutboundSettings(),
    ]);

    const loaded = buildItsmConnectorsAdminPageLoadResult({
      health: healthOutcome,
      settings: settingsOutcome,
    });

    if (!loaded.health.failed && loaded.health.value !== null) {
      setHealth(loaded.health.value);
    }

    if (loaded.health.failed) {
      setHealthLoadError(sanitizeItsmConnectorsAdminLoadError(loaded.health.errorMessage, "health"));
    }

    if (!loaded.settings.failed && loaded.settings.value !== null) {
      setSettings(loaded.settings.value);
    }

    if (loaded.settings.failed) {
      setSettingsLoadError(sanitizeItsmConnectorsAdminLoadError(loaded.settings.errorMessage, "settings"));
    }

    setIsLoading(false);
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
        actions={
          <>
            <Button
              type="button"
              variant={hasLoadErrors ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              onClick={() => void refresh()}
              data-testid="admin-itsm-connectors-refresh"
            >
              {isLoading ? "Refreshing…" : hasLoadErrors ? "Retry" : "Refresh"}
            </Button>
            <PageContextualHelpButton />
          </>
        }
        data-testid="admin-itsm-connectors-page-heading"
      />

      <ItsmConnectorsBuyerJiraServicenowVocabularyRail currentSurfaceId="itsm-connectors" />

      <ItsmConnectorsFindingTicketVocabularyRail currentSurfaceId="itsm-connectors" />

      {showLoadingSkeleton ? (
        <AdminItsmConnectorsPageLoadingSkeleton />
      ) : (
        <>
          {healthLoadError !== null ? (
            <p
              className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
              role="alert"
              data-testid="admin-itsm-health-load-error"
            >
              {healthLoadError}
            </p>
          ) : null}

          <AdminItsmConnectorOnboardingWizard
            initialSettings={settings}
            initialHealth={health}
            settingsLoadFailed={settingsLoadError !== null}
            onSettingsSaved={setSettings}
            onHealthUpdated={setHealth}
          />

          <section className="space-y-4" aria-labelledby="admin-itsm-connectors-health-heading">
            <h2 id="admin-itsm-connectors-health-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
              Connector health
            </h2>
            <ItsmConnectorProbeCard title="Jira" probe={health?.jira} testId="admin-itsm-jira-health" />
            <ItsmConnectorProbeCard title="ServiceNow" probe={health?.serviceNow} testId="admin-itsm-servicenow-health" />
          </section>
        </>
      )}

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
          {nativeEnabled ? (
            <p className="m-0">{ITSM_CONNECTORS_NATIVE_ENABLED_MESSAGE}</p>
          ) : (
            <p className="m-0">{ITSM_CONNECTORS_NATIVE_DISABLED_MESSAGE}</p>
          )}
          {settingsLoadError !== null ? (
            <p className="m-0 text-red-600 dark:text-red-400" role="alert" data-testid="admin-itsm-settings-load-error">
              {settingsLoadError}
            </p>
          ) : settings?.hasTenantOverrides ? (
            <p className="m-0">Tenant ITSM outbound overrides are saved for this tenant.</p>
          ) : (
            <p className="m-0">No tenant overrides saved yet — use the onboarding wizard above.</p>
          )}
        </CardContent>
      </Card>

      <FindingCorrelationVocabularyDisambiguation testId="admin-itsm-correlation-vocabulary" />
    </div>
  );
}
