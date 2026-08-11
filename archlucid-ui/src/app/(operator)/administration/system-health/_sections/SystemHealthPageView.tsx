"use client";

import { cn } from "@/lib/utils";

import { DeploymentBuildFingerprintStrip } from "@/components/shell/DeploymentBuildFingerprintStrip";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SYSTEM_HEALTH_CLAIM_DISCIPLINE, SYSTEM_HEALTH_SOURCES, SYSTEM_HEALTH_SOURCES_INTRO } from "@/lib/system-health-evidence-copy";
import {
  SYSTEM_HEALTH_CLAIM_SCOPE_SUMMARY,
  systemHealthPageSubtitle,
} from "@/lib/system-health-page-copy";
import {
  HEALTH_DASHBOARD_PAGE_CLASS,
  HealthCheckRow,
  HealthDashboardSection,
  HealthGroupedReadiness,
  HealthOverallStatusHeader,
  HealthStatusChipRowLabel,
  HealthSummaryTileGrid,
} from "@/components/health-dashboard/HealthDashboardSections";
import { HealthBuildDetailsDisclosure } from "@/components/health-dashboard/HealthBuildDetailsDisclosure";
import { HealthNeedsAttentionPanel } from "@/components/health-dashboard/HealthNeedsAttentionPanel";
import { HealthRelatedSurfacesStrip } from "@/components/health-dashboard/HealthRelatedSurfacesStrip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  HEALTH_NEEDS_ATTENTION_ANCHOR_ID,
  HEALTH_READINESS_ANCHOR_ID,
} from "@/lib/health-dashboard-anchors";
import { buildHealthSummaryTiles } from "@/lib/health-dashboard-summary";
import { buildHealthHeadlineQualifier } from "@/lib/health-headline-qualifier";
import { selectHealthExceptionRows } from "@/lib/health-readiness-exceptions";
import { groupReadinessRows, presentReadinessRow, resolveOverallHealthHeadline } from "@/lib/health-readiness-presentation";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";
import { SystemHealthDemoPageView } from "./SystemHealthDemoPageView";
import { SystemHealthPageHeader } from "./SystemHealthPageHeader";

type Props = {
  readonly model: SystemHealthPageViewModel;
};

const CRITICAL_DEPENDENCIES_GROUP_TITLE = "Critical dependencies";

const INTERNAL_DIAGNOSTICS_LINK = {
  label: "Diagnostics dashboard",
  href: "/internal/health",
} as const;

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
  const dependencyRows = m.criticalDependencies.map((row) =>
    presentReadinessRow(row.entryName, row.status, undefined, row.detail),
  );
  const exceptions = selectHealthExceptionRows(
    readinessGroups,
    dependencyRows.map((row) => ({ row, groupTitle: CRITICAL_DEPENDENCIES_GROUP_TITLE })),
  );
  const qualifier = buildHealthHeadlineQualifier(exceptions);
  const summaryTiles = buildHealthSummaryTiles({
    overallStatus: overall,
    ready: m.ready,
    configurationHealth: null,
    configLint: null,
    circuitGates: [],
    lastRefreshedAt: m.lastRefreshedAt,
    loading: m.loading,
  });
  const relatedSurfaceLinks = m.showTechnicalDetails
    ? [...SYSTEM_HEALTH_SOURCES, INTERNAL_DIAGNOSTICS_LINK]
    : SYSTEM_HEALTH_SOURCES;

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

      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="system-health" />

      <HealthOverallStatusHeader
        overallStatus={overall}
        title={headline.title}
        subtitle={headline.subtitle}
        badgeTestId="system-health-overall-badge"
        qualifier={qualifier.text}
        qualifierAnchorId={HEALTH_NEEDS_ATTENTION_ANCHOR_ID}
      />

      <HealthNeedsAttentionPanel
        exceptions={exceptions}
        anchorId={HEALTH_NEEDS_ATTENTION_ANCHOR_ID}
        testId="system-health-needs-attention"
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
        <div className="space-y-4">
          <section aria-labelledby="system-health-probes-heading">
            <HealthDashboardSection
              title="Service probes"
              testId="system-health-probes"
              headingId="system-health-probes-heading"
            >
              <dl className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                <HealthStatusChipRowLabel
                  term="Application liveness"
                  status={m.liveStatus}
                  detail={m.liveOk ? "Responding" : "Not reachable"}
                />
                <HealthStatusChipRowLabel
                  term="Readiness summary"
                  status={overall}
                  detail="Dependencies checked"
                />
              </dl>
            </HealthDashboardSection>
            {m.readyError !== null ? (
              <p className={cn("mt-3 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {m.readyError}
              </p>
            ) : null}
          </section>

          <HealthRelatedSurfacesStrip
            intro={SYSTEM_HEALTH_SOURCES_INTRO}
            links={relatedSurfaceLinks}
            testId="system-health-related-surfaces"
          />
        </div>

        <section aria-labelledby="system-health-dependencies-heading">
          <HealthDashboardSection
            title={CRITICAL_DEPENDENCIES_GROUP_TITLE}
            description="Database, AI, and cache services required for review workflows."
            headingId="system-health-dependencies-heading"
          >
            <div className="space-y-2" data-testid="system-health-dependencies-table">
              {dependencyRows.map((row) => (
                <HealthCheckRow
                  key={row.checkId}
                  row={row}
                  disclosureScope={CRITICAL_DEPENDENCIES_GROUP_TITLE.toLowerCase()}
                />
              ))}
            </div>
          </HealthDashboardSection>
        </section>
      </div>

      <section
        id={HEALTH_READINESS_ANCHOR_ID}
        // Focusable so tile and hero jump links move keyboard focus, not just the viewport.
        tabIndex={-1}
        aria-labelledby="system-health-readiness-heading"
      >
        <HealthDashboardSection
          title="Readiness checks"
          testId="system-health-readiness"
          headingId="system-health-readiness-heading"
        >
          <HealthGroupedReadiness groups={readinessGroups} testId="system-health-ready-groups" />
        </HealthDashboardSection>
      </section>

      <CollapsibleSection
        title={SYSTEM_HEALTH_CLAIM_SCOPE_SUMMARY}
        defaultOpen={false}
        sectionTestId="system-health-operator-claim-scope"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {SYSTEM_HEALTH_CLAIM_DISCIPLINE}
        </p>
      </CollapsibleSection>
    </div>
  );
}
