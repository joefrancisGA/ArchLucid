"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import { ConfigurationSystemHealthVocabularyRail } from "@/components/ConfigurationSystemHealthVocabularyRail";
import { DeploymentBuildFingerprintStrip } from "@/components/shell/DeploymentBuildFingerprintStrip";
import { DeploymentStatusSystemHealthVocabularyRail } from "@/components/DeploymentStatusSystemHealthVocabularyRail";
import { RagHealthSystemHealthVocabularyRail } from "@/components/RagHealthSystemHealthVocabularyRail";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { SystemHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { SYSTEM_HEALTH_CLAIM_DISCIPLINE, SYSTEM_HEALTH_SOURCES, SYSTEM_HEALTH_SOURCES_INTRO } from "@/lib/system-health-evidence-copy";
import {
  SYSTEM_HEALTH_CLAIM_SCOPE_SUMMARY,
  SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID,
  SYSTEM_HEALTH_PRIMARY_CONTENT_ID,
  SYSTEM_HEALTH_SKIP_LINK_LABEL,
  SYSTEM_HEALTH_SKIP_TARGET_ID,
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
import {
  parseSystemHealthClaimScopeOpenFromSearch,
  systemHealthClaimScopeHrefFromSearch,
} from "@/lib/administration/system-health-claim-scope-url";

type Props = {
  readonly model: SystemHealthPageViewModel;
};

const CRITICAL_DEPENDENCIES_GROUP_TITLE = "Critical dependencies";

const INTERNAL_DIAGNOSTICS_LINK = {
  label: "Diagnostics dashboard",
  href: "/internal/health",
} as const;

export function SystemHealthPageView(props: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/system-health";
  const searchParams = useSearchParams();
  const systemHealthClaimScopeOpenParam = searchParams.get("systemHealthClaimScopeOpen");
  const m = props.model;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [claimScopeOpen, setClaimScopeOpenState] = useState(() =>
    parseSystemHealthClaimScopeOpenFromSearch(systemHealthClaimScopeOpenParam),
  );

  const syncClaimScopeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(systemHealthClaimScopeHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setClaimScopeOpen = useCallback(
    (open: boolean) => {
      setClaimScopeOpenState(open);
      syncClaimScopeOpenToUrl(open);
    },
    [syncClaimScopeOpenToUrl],
  );

  useEffect(() => {
    setClaimScopeOpenState(parseSystemHealthClaimScopeOpenFromSearch(systemHealthClaimScopeOpenParam));
  }, [systemHealthClaimScopeOpenParam]);

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

  const workspaceBody = (
    <>
      {m.statusTransitions.length > 0 ? (
        <div
          className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40"
          data-testid="system-health-status-transitions"
          role="status"
        >
          <p className={cn("m-0 mb-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            Status changes since you opened this page
          </p>
          <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
            {m.statusTransitions.map((transition) => (
              <li key={`${transition.at.toISOString()}-${transition.message}`}>{transition.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!buyerPolishedShell ? (
        <>
          <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="system-health" />
          {isArchLucidInternalOperatorShellEnv() ? (
            <ConfigurationSystemHealthVocabularyRail currentSurfaceId="system-health" />
          ) : null}
          <RagHealthSystemHealthVocabularyRail currentSurfaceId="system-health" />
          <DeploymentStatusSystemHealthVocabularyRail currentSurfaceId="system-health" />
        </>
      ) : null}

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

          {!buyerPolishedShell ? (
            <HealthRelatedSurfacesStrip
              intro={SYSTEM_HEALTH_SOURCES_INTRO}
              links={relatedSurfaceLinks}
              testId="system-health-related-surfaces"
            />
          ) : null}
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

      {!buyerPolishedShell ? (
        <CollapsibleSection
          title={SYSTEM_HEALTH_CLAIM_SCOPE_SUMMARY}
          open={claimScopeOpen}
          onToggle={setClaimScopeOpen}
          sectionTestId="system-health-operator-claim-scope"
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {SYSTEM_HEALTH_CLAIM_DISCIPLINE}
          </p>
        </CollapsibleSection>
      ) : null}
    </>
  );

  return (
    <div className={cn(HEALTH_DASHBOARD_PAGE_CLASS, "space-y-4")} data-testid="system-health-page">
      {buyerPolishedShell ? (
        <a
          href={`#${SYSTEM_HEALTH_SKIP_TARGET_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {SYSTEM_HEALTH_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <div
        id={buyerPolishedShell ? SYSTEM_HEALTH_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? SYSTEM_HEALTH_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <SystemHealthPageHeader
          subtitle={systemHealthPageSubtitle(buyerPolishedShell)}
          loading={m.loading}
          lastRefreshedAt={m.lastRefreshedAt}
          onRefresh={() => {
            void m.refresh();
          }}
        />

        {buyerPolishedShell ? (
          <div
            id={SYSTEM_HEALTH_SKIP_TARGET_ID}
            data-testid={SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            {workspaceBody}
          </div>
        ) : (
          workspaceBody
        )}

        {buyerPolishedShell ? (
          <div data-testid="system-health-orientation-bottom">
            <SystemHealthEvidenceOrientationStrip />
          </div>
        ) : null}
      </div>
    </div>
  );
}
