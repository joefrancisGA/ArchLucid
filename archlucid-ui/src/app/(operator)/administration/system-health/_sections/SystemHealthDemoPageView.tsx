"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HealthStatusChip } from "@/components/health-dashboard/HealthStatusChip";
import {
  HEALTH_DASHBOARD_PAGE_CLASS,
  HealthDashboardSection,
  HealthOverallStatusHeader,
  HealthSummaryTileGrid,
} from "@/components/health-dashboard/HealthDashboardSections";
import {
  DEMO_SYSTEM_HEALTH_CONTEXT_NOTE,
  DEMO_SYSTEM_HEALTH_LIMITATION_LINES,
  DEMO_SYSTEM_HEALTH_OVERALL_STATUS,
  DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE,
  DEMO_SYSTEM_HEALTH_OVERALL_TITLE,
  buildDemoHealthSummaryTiles,
  buildDemoOperationalChecks,
  type DemoOperationalCheck,
} from "@/lib/demo-system-health-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SYSTEM_HEALTH_CLAIM_DISCIPLINE } from "@/lib/system-health-evidence-copy";
import { SYSTEM_HEALTH_DEMO_SCOPE_SUMMARY, systemHealthPageSubtitle } from "@/lib/system-health-page-copy";

import { SystemHealthPageHeader } from "./SystemHealthPageHeader";
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
        <HealthStatusChip status={check.status} />
      </div>
    </div>
  );
}

export function SystemHealthDemoPageView(props: SystemHealthDemoPageViewProps) {
  const summaryTiles = buildDemoHealthSummaryTiles();
  const operationalChecks = buildDemoOperationalChecks();

  return (
    <div className={cn(HEALTH_DASHBOARD_PAGE_CLASS, "space-y-4")} data-testid="system-health-demo-page">
      <SystemHealthPageHeader
        subtitle={systemHealthPageSubtitle(true)}
        loading={props.loading}
        lastRefreshedAt={props.lastRefreshedAt}
        onRefresh={props.onRefresh}
      />

      <HealthOverallStatusHeader
        overallStatus={DEMO_SYSTEM_HEALTH_OVERALL_STATUS}
        title={DEMO_SYSTEM_HEALTH_OVERALL_TITLE}
        subtitle={DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE}
        badgeTestId="system-health-demo-overall-badge"
      />

      <HealthSummaryTileGrid tiles={summaryTiles} testId="system-health-summary-tiles" />

      <section aria-labelledby="system-health-operational-checks-heading">
        <HealthDashboardSection title="Operational checks" testId="system-health-operational-checks-heading">
          <div className="space-y-2" data-testid="system-health-operational-checks">
            {operationalChecks.map((check) => (
              <DemoOperationalCheckRow key={check.id} check={check} />
            ))}
          </div>
        </HealthDashboardSection>
      </section>

      <details
        className={cn(
          "rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-700",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="system-health-demo-scope-note"
      >
        <summary className="cursor-pointer font-medium text-al-text-primary">{SYSTEM_HEALTH_DEMO_SCOPE_SUMMARY}</summary>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{DEMO_SYSTEM_HEALTH_CONTEXT_NOTE}</p>
        <ul className={cn("m-0 mt-2 list-disc space-y-1 ps-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {DEMO_SYSTEM_HEALTH_LIMITATION_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
{props.showTechnicalDetails ? (
        <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="system-health-technical-details">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {SYSTEM_HEALTH_CLAIM_DISCIPLINE} Internal diagnostics, dependency probes, and deployment identity are available on the{" "}
            <Link href="/internal/health" className={OPERATOR_LINK.nav}>
              Diagnostics dashboard
            </Link>
            .
          </p>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
