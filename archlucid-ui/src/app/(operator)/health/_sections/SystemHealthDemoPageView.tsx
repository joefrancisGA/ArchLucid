"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusPill } from "@/components/StatusPill";
import {
  HEALTH_DASHBOARD_PAGE_CLASS,
  HealthDashboardSection,
  HealthOverallStatusHeader,
  HealthRefreshToolbar,
  HealthSummaryTileGrid,
} from "@/components/health-dashboard/HealthDashboardSections";
import {
  DEMO_SYSTEM_HEALTH_CONTEXT_NOTE,
  DEMO_SYSTEM_HEALTH_LIMITATION_LINES,
  DEMO_SYSTEM_HEALTH_OVERALL_STATUS,
  DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE,
  DEMO_SYSTEM_HEALTH_OVERALL_TITLE,
  DEMO_SYSTEM_HEALTH_PAGE_SUBTITLE,
  buildDemoHealthSummaryTiles,
  buildDemoOperationalChecks,
  type DemoOperationalCheck,
} from "@/lib/demo-system-health-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type SystemHealthDemoPageViewProps = {
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly showTechnicalDetails: boolean;
};

function DemoOperationalCheckRow(props: { readonly check: DemoOperationalCheck }) {
  const { check } = props;

  return (
    <div
      className="rounded-md border border-neutral-200/80 px-3 py-2 dark:border-neutral-800"
      data-testid={`demo-system-health-check-${check.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{check.label}</p>
          {check.explanation !== null ? (
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{check.explanation}</p>
          ) : null}
        </div>
        <StatusPill
          status={check.status}
          domain="health"
          uppercase={false}
          className={cn("shrink-0 rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
        />
      </div>
    </div>
  );
}

export function SystemHealthDemoPageView(props: SystemHealthDemoPageViewProps) {
  const summaryTiles = buildDemoHealthSummaryTiles({
    lastRefreshedAt: props.lastRefreshedAt,
    loading: props.loading,
  });

  const operationalChecks = buildDemoOperationalChecks();

  return (
    <div className={cn(HEALTH_DASHBOARD_PAGE_CLASS, "space-y-6")} data-testid="system-health-demo-page">
      <OperatorPageHeader title="System health" subtitle={DEMO_SYSTEM_HEALTH_PAGE_SUBTITLE} />

      <p
        className={cn(
          "m-0 rounded-md border border-amber-600/20 bg-amber-500/5 px-4 py-3 text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="system-health-demo-context-note"
      >
        {DEMO_SYSTEM_HEALTH_CONTEXT_NOTE}
      </p>

      <HealthOverallStatusHeader
        overallStatus={DEMO_SYSTEM_HEALTH_OVERALL_STATUS}
        title={DEMO_SYSTEM_HEALTH_OVERALL_TITLE}
        subtitle={DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE}
        badgeTestId="system-health-overall-badge"
      />

      <HealthSummaryTileGrid tiles={summaryTiles} testId="system-health-summary-tiles" />

      <HealthRefreshToolbar
        loading={props.loading}
        lastRefreshedAt={props.lastRefreshedAt}
        onRefresh={props.onRefresh}
        refreshTestId="system-health-refresh"
      />

      <section aria-labelledby="system-health-operational-checks-heading">
        <HealthDashboardSection title="Operational checks" testId="system-health-operational-checks-heading">
          <div className="space-y-2" data-testid="system-health-operational-checks">
            {operationalChecks.map((check) => (
              <DemoOperationalCheckRow key={check.id} check={check} />
            ))}
          </div>
        </HealthDashboardSection>
      </section>

      <section aria-labelledby="system-health-demo-limitations-heading">
        <HealthDashboardSection title="Demo limitations" testId="system-health-demo-limitations-heading">
          <ul className={cn("m-0 list-disc space-y-1 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {DEMO_SYSTEM_HEALTH_LIMITATION_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </HealthDashboardSection>
      </section>

      {props.showTechnicalDetails ? (
        <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="system-health-technical-details">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Internal diagnostics, dependency probes, and deployment identity are available on the{" "}
            <Link href="/admin/health" className={OPERATOR_LINK.nav}>
              Diagnostics dashboard
            </Link>
            .
          </p>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
