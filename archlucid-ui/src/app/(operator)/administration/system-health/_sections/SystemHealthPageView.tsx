"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusPill } from "@/components/StatusPill";
import { DeploymentBuildFingerprintStrip } from "@/components/shell/DeploymentBuildFingerprintStrip";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SYSTEM_HEALTH_CLAIM_DISCIPLINE } from "@/lib/system-health-evidence-copy";
import { systemHealthPageSubtitle } from "@/lib/system-health-page-copy";
import {
  HEALTH_DASHBOARD_PAGE_CLASS,
  HealthCheckRow,
  HealthDashboardSection,
  HealthGroupedReadiness,
  HealthOverallStatusHeader,
  HealthSummaryTileGrid,
} from "@/components/health-dashboard/HealthDashboardSections";
import { HealthBuildDetailsDisclosure } from "@/components/health-dashboard/HealthBuildDetailsDisclosure";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { buildHealthSummaryTiles } from "@/lib/health-dashboard-summary";
import { groupReadinessRows, presentReadinessRow, resolveOverallHealthHeadline } from "@/lib/health-readiness-presentation";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";
import { SystemHealthDemoPageView } from "./SystemHealthDemoPageView";
import { SystemHealthPageHeader } from "./SystemHealthPageHeader";
import { SystemHealthSourcesStrip } from "./SystemHealthSourcesStrip";

type Props = {
  readonly model: SystemHealthPageViewModel;
};

export function SystemHealthPageView(props: Props) {
  const m = props.model;

  if (m.showDemoWorkspaceDashboard) {
    return (
      <SystemHealthDemoPageView
        loading={m.loading}
        lastRefreshedAt={m.lastRefreshedAt}
        onRefresh={() => {
          void m.refresh();
        }}
        showTechnicalDetails={m.showTechnicalDetails}
      />
    );
  }

  const overall = m.ready?.status ?? "Unknown";
  const headline = resolveOverallHealthHeadline(overall);
  const readinessGroups = groupReadinessRows(m.ready?.entries ?? []);
  const summaryTiles = buildHealthSummaryTiles({
    overallStatus: overall,
    ready: m.ready,
    configurationHealth: null,
    configLint: null,
    circuitGates: [],
    lastRefreshedAt: m.lastRefreshedAt,
    loading: m.loading,
  });

  return (
    <div className={cn(HEALTH_DASHBOARD_PAGE_CLASS, "space-y-4")} data-testid="system-health-page">
      <SystemHealthPageHeader
        subtitle={systemHealthPageSubtitle(false)}
        loading={m.loading}
        lastRefreshedAt={m.lastRefreshedAt}
        onRefresh={() => {
          void m.refresh();
        }}
      />

      <HealthOverallStatusHeader
        overallStatus={overall}
        title={headline.title}
        subtitle={headline.subtitle}
        badgeTestId="system-health-overall-badge"
      />
      <HealthSummaryTileGrid tiles={summaryTiles} testId="system-health-summary-tiles" />
      <HealthBuildDetailsDisclosure
        version={m.version}
        testId="system-health-build-identity"
        uiBuildStrip={
          <div data-testid="system-health-ui-build-identity">
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>UI build</p>
            <DeploymentBuildFingerprintStrip className="mt-1" />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="system-health-probes-heading" className="space-y-3">
          <HealthDashboardSection title="Service probes" testId="system-health-probes-heading">
            <dl className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Application liveness</dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={m.liveStatus} domain="health" uppercase={false} className={OPERATOR_TYPOGRAPHY.badge} />
                  <span className="text-al-text-secondary">{m.liveOk ? "Responding" : "Not reachable"}</span>
                </dd>
              </div>
              <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Readiness summary</dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={overall} domain="health" uppercase={false} className={OPERATOR_TYPOGRAPHY.badge} />
                  <span className="text-al-text-secondary">Dependencies checked</span>
                </dd>
              </div>
            </dl>
          </HealthDashboardSection>
          {m.readyError !== null ? (
            <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {m.readyError}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="system-health-dependencies-heading">
          <HealthDashboardSection
            title="Critical dependencies"
            description="Database, AI, and cache services required for review workflows."
          >
            <div className="space-y-2" data-testid="system-health-dependencies-table">
              {m.criticalDependencies.map((row) => {
                const presented = presentReadinessRow(row.entryName, row.status, undefined, row.detail);

                return <HealthCheckRow key={row.entryName} row={presented} />;
              })}
            </div>
          </HealthDashboardSection>
        </section>
      </div>

      <section aria-labelledby="system-health-readiness-heading">
        <HealthDashboardSection title="Readiness checks" testId="system-health-readiness-heading">
          <HealthGroupedReadiness groups={readinessGroups} testId="system-health-ready-groups" />
        </HealthDashboardSection>
      </section>

      <SystemHealthSourcesStrip />

      <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="system-health-operator-claim-scope">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {SYSTEM_HEALTH_CLAIM_DISCIPLINE} Tenant administrators can open{" "}
          <Link href="/internal/health" className={OPERATOR_LINK.nav}>
            Diagnostics dashboard
          </Link>{" "}
          for configuration advisories, circuit breakers, and onboarding activity.
        </p>
      </CollapsibleSection>
    </div>
  );
}
