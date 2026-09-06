"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { Card, CardContent } from "@/components/ui/card";
import { HealthStatusChip } from "@/components/health-dashboard/HealthStatusChip";
import {
  HEALTH_DASHBOARD_PAGE_CLASS,
  HealthCheckRow,
  HealthDashboardSection,
  HealthEmptyGoodState,
  HealthGroupedReadiness,
  HealthOverallStatusHeader,
  HealthRefreshToolbar,
  HealthSummaryTileGrid,
} from "@/components/health-dashboard/HealthDashboardSections";
import { AdminHealthCircuitGateTechnicalDisclosure } from "@/components/health-dashboard/AdminHealthCircuitGateTechnicalDisclosure";
import { AdminHealthLintRuleTechnicalDisclosure } from "@/components/health-dashboard/AdminHealthLintRuleTechnicalDisclosure";
import { HealthBuildDetailsDisclosure } from "@/components/health-dashboard/HealthBuildDetailsDisclosure";
import { TenantCatalogMigrationDiagnosticsSection } from "@/components/tenancy/TenantCatalogMigrationDiagnosticsSection";
import { AdminHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { INTERNAL_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import {
  adminHealthConfigProbesDisclosureHrefFromSearch,
  parseAdminHealthConfigProbesOpenFromSearch,
} from "@/lib/health-dashboard/admin-health-config-probes-disclosure-url";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isDataArchivalHealthDegraded } from "@/lib/health-dashboard-types";
import { presentConfigLintFindings } from "@/lib/health-config-lint-presentation";
import { buildHealthSummaryTiles, humanizeCircuitGateName } from "@/lib/health-dashboard-summary";
import {
  groupReadinessRows,
  presentConfigurationProbeRow,
  resolveOverallHealthHeadline,
} from "@/lib/health-readiness-presentation";

import type { AdminHealthPageViewModel } from "./admin-health-view-model";

type Props = {
  readonly model: AdminHealthPageViewModel;
};

/**
 * Customer-facing diagnostics dashboard for tenant administrators.
 */
export function AdminHealthPageView(props: Props) {
  const m = props.model;
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_HEALTH_PATH;
  const searchParams = useSearchParams();
  const adminHealthConfigProbesOpenParam = searchParams.get("adminHealthConfigProbesOpen");
  const [configProbesOpen, setConfigProbesOpenState] = useState(() =>
    parseAdminHealthConfigProbesOpenFromSearch(adminHealthConfigProbesOpenParam),
  );

  const syncConfigProbesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(adminHealthConfigProbesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setConfigProbesOpen = useCallback(
    (open: boolean) => {
      setConfigProbesOpenState(open);
      syncConfigProbesOpenToUrl(open);
    },
    [syncConfigProbesOpenToUrl],
  );

  useEffect(() => {
    setConfigProbesOpenState(parseAdminHealthConfigProbesOpenFromSearch(adminHealthConfigProbesOpenParam));
  }, [adminHealthConfigProbesOpenParam]);

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Workspace health diagnostics"
        description="In a connected tenant, architects monitor platform health, readiness, and configuration advisories here."
      />
    );
  }

  const overall = m.ready?.status ?? "Unknown";
  const headline = resolveOverallHealthHeadline(overall);
  const readinessGroups = groupReadinessRows(m.ready?.entries ?? []);
  const configurationRows = (m.configurationHealth?.checks ?? []).map((row) =>
    presentConfigurationProbeRow(row.name, row.status, row.detail),
  );
  const lintFindings = presentConfigLintFindings(m.configLint);
  const summaryTiles = buildHealthSummaryTiles({
    overallStatus: overall,
    ready: m.ready,
    configurationHealth: m.configurationHealth,
    configLint: m.configLint,
    circuitGates: m.circuitGates,
    lastRefreshedAt: m.lastRefreshedAt,
    loading: m.loading,
  });
  const archivalDegraded =
    m.ready !== null && isDataArchivalHealthDegraded(m.ready.entries);

  return (
    <div className={cn(HEALTH_DASHBOARD_PAGE_CLASS, OPERATOR_LAYOUT.sectionStack)} data-testid="admin-health-page">
      <header className="space-y-4">
        <OperatorPageHeader
          navHref={INTERNAL_HEALTH_PATH}
          title="Diagnostics dashboard"
          subtitle="Workspace health, required services, and configuration advisories for this deployment."
          actions={<PageContextualHelpButton />}
        />
        <AdminHealthEvidenceOrientationStrip />
        <HealthOverallStatusHeader
          overallStatus={overall}
          title={headline.title}
          subtitle={headline.subtitle}
          badgeTestId="admin-health-overall-badge"
        />
        <HealthSummaryTileGrid tiles={summaryTiles} testId="admin-health-summary-tiles" />
        <HealthRefreshToolbar
          loading={m.loading}
          lastRefreshedAt={m.lastRefreshedAt}
          onRefresh={() => void m.refresh()}
          refreshTestId="admin-health-refresh"
        />
        <HealthBuildDetailsDisclosure version={m.version} testId="admin-health-build-identity" />
      </header>

      <TenantCatalogMigrationDiagnosticsSection />

      {m.readyError !== null ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {m.readyError}
        </p>
      ) : null}

      {archivalDegraded ? (
        <div
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
          data-testid="admin-health-data-archival-degraded"
        >
          <strong className="font-semibold">Data retention archival</strong> is degraded. The last archival run did not
          complete successfully while retention is enabled. Review worker logs or contact support if this persists.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <HealthDashboardSection
              title="Readiness checks"
              description="Dependency probes used before routing traffic to this deployment."
              testId="admin-health-ready-section"
            >
              <HealthGroupedReadiness groups={readinessGroups} testId="admin-health-ready-table" />
            </HealthDashboardSection>
          </CardContent>
        </Card>

        <div className={OPERATOR_LAYOUT.sectionStack}>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <HealthDashboardSection
                title="Configuration connectivity"
                description="Live connectivity checks for sign-in, database, and secret storage."
              >
                {m.configurationHealthNote !== null ? (
                  <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-configuration-health-note">
                    {m.configurationHealthNote}
                  </p>
                ) : null}
                {configurationRows.length > 0 ? (
                  <div className="space-y-2" data-testid="admin-health-configuration-health-table">
                    {configurationRows.map((row) => (
                      <HealthCheckRow key={row.checkId} row={row} />
                    ))}
                  </div>
                ) : (
                  !m.configurationHealthNote && (
                    <HealthEmptyGoodState message="No configuration connectivity probes were returned for this session." />
                  )
                )}
                <CollapsibleSection
                  title="Technical details — configuration probes API"
                  open={configProbesOpen}
                  onToggle={setConfigProbesOpen}
                >
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Support engineers can trace probe payloads from the authenticated configuration-health diagnostics endpoint.
                  </p>
                </CollapsibleSection>
              </HealthDashboardSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <HealthDashboardSection
                title="Configuration advisories"
                description="Non-secret hosting profile findings that may affect reliability or retrieval quality."
              >
                {m.configLintNote !== null ? (
                  <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-config-lint-note">
                    {m.configLintNote}
                  </p>
                ) : null}
                {m.configLint !== null ? (
                  <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-config-lint-body">
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                      Hosting profile:{" "}
                      <span className="font-medium text-al-text-primary">{m.configLint.hostingEnvironmentName ?? " — "}</span>
                    </p>
                    <div>
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Blocking</p>
                      {lintFindings.blocking.length > 0 ? (
                        <ul className="mt-2 space-y-3">
                          {lintFindings.blocking.map((finding) => (
                            <li key={finding.ruleId} className="rounded-md border border-rose-600/30 bg-rose-500/5 px-3 py-2">
                              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{finding.title}</p>
                              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{finding.message}</p>
                              {finding.recommendedAction !== null ? (
                                <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                                  <span className="font-medium">Recommended action:</span> {finding.recommendedAction}
                                </p>
                              ) : null}
                              <AdminHealthLintRuleTechnicalDisclosure ruleId={finding.ruleId} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <HealthEmptyGoodState message="No blocking issues" />
                      )}
                    </div>
                    <div>
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Advisory</p>
                      {lintFindings.advisory.length > 0 ? (
                        <ul className="mt-2 space-y-3">
                          {lintFindings.advisory.map((finding) => (
                            <li key={finding.ruleId} className="rounded-md border border-amber-600/30 bg-amber-500/5 px-3 py-2">
                              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{finding.title}</p>
                              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{finding.message}</p>
                              {finding.recommendedAction !== null ? (
                                <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                                  <span className="font-medium">Recommended action:</span> {finding.recommendedAction}
                                </p>
                              ) : null}
                              <AdminHealthLintRuleTechnicalDisclosure ruleId={finding.ruleId} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <HealthEmptyGoodState message="No advisory findings" />
                      )}
                    </div>
                  </div>
                ) : null}
              </HealthDashboardSection>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <HealthDashboardSection
              title="AI service circuit breakers"
              description="Protective gates for model and embedding calls when providers are unstable."
            >
              {m.circuitNote !== null ? (
                <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-circuit-note">
                  {m.circuitNote}
                </p>
              ) : null}
              {m.circuitGates.length > 0 ? (
                <div className="space-y-2" data-testid="admin-health-circuit-table">
                  {m.circuitGates.map((gate) => (
                    <div key={gate.name} className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {humanizeCircuitGateName(gate.name)}
                        </p>
                        <HealthStatusChip status={gate.state} className={OPERATOR_TYPOGRAPHY.badge} />
                      </div>
                      <AdminHealthCircuitGateTechnicalDisclosure
                        gateName={gate.name}
                        breakDurationSeconds={gate.breakDurationSeconds}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                !m.circuitNote && <HealthEmptyGoodState message="No active circuit breakers" />
              )}
            </HealthDashboardSection>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <HealthDashboardSection
              title="Onboarding activity"
              description="Recent first-review completion counters for this API instance."
            >
              {m.ratesNote !== null ? (
                <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-rates-note">
                  {m.ratesNote}
                </p>
              ) : null}
              {m.rates ? (
                <div className="space-y-3" data-testid="admin-health-rates-table">
                  <dl className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                    <div className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
                      <dt className="text-al-text-secondary">First reviews committed</dt>
                      <dd className="m-0 text-lg font-semibold text-al-text-primary">{m.rates.firstRunCommittedTotal}</dd>
                    </div>
                    <div className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800">
                      <dt className="text-al-text-secondary">First sessions completed</dt>
                      <dd className="m-0 text-lg font-semibold text-al-text-primary">{m.rates.firstSessionCompletedTotal}</dd>
                    </div>
                    <div className="rounded-md border border-neutral-200/80 px-3 py-2 sm:col-span-2 dark:border-neutral-800">
                      <dt className="text-al-text-secondary">Commit-to-session ratio</dt>
                      <dd className="m-0 text-lg font-semibold text-al-text-primary">
                        {m.rates.firstRunCommittedPerSessionRatio.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                  {m.rates.windowNote !== undefined
                  && m.rates.windowNote !== null
                  && m.rates.windowNote.trim().length > 0
                  && !/e2e|screenshot|fixture|process lifetime/i.test(m.rates.windowNote) ? (
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{m.rates.windowNote}</p>
                  ) : null}
                </div>
              ) : (
                !m.ratesNote && <HealthEmptyGoodState message="Onboarding activity metrics are not available for this session." />
              )}
            </HealthDashboardSection>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
