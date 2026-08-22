"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ComplianceDriftChartPdfExport } from "@/components/ComplianceDriftChartPdfExport";
import { DecisionsNeededSummaryCard } from "@/components/governance/DecisionsNeededSummaryCard";
import { GovernanceBypassAuditPanel } from "@/components/governance/GovernanceBypassAuditPanel";
import { DataArchivalDegradedBanner } from "@/components/governance/DataArchivalDegradedBanner";
import { SponsorWorkspaceHealthPageHero } from "@/components/governance/SponsorWorkspaceHealthPageHero";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import { useGovernanceDashboardQuery } from "@/hooks/use-governance-dashboard-query";
import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";
import { usePilotValueReportQuery } from "@/hooks/use-pilot-value-report-query";
import { useWorkspaceHealthPrecommitAuditCountsQuery } from "@/hooks/use-workspace-health-precommit-audit-counts-query";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  hoursSurfaced,
  formatHours,
  HOURS_PER_PRECOMMIT_BLOCK,
} from "@/lib/roi-assumptions";
import { formatSponsorWorkspaceScopeDescription } from "@/lib/workspace-health-scope-banner";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  executiveWorkspaceHealthKpiTitle,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
  SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY,
} from "@/lib/sponsor-workspace-health-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { AUDIT_TRAIL_LABEL } from "@/lib/usability/canonical-product-terms";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { computeWorkspaceHealthSlaStats } from "@/lib/workspace-health-sla";

const WORKSPACE_HEALTH_POLL_MS = 30_000;

const DEFAULT_SCOPE_FALLBACK =
  "Figures use the authenticated tenant / workspace / project sent with each request — the same boundaries as governance and audit. Not a cross-workspace rollup.";

function rollingBounds(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

type WorkspaceHealthLoadError = {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

function resolveWorkspaceHealthLoadError(error: unknown): WorkspaceHealthLoadError {
  if (isApiRequestError(error)) {
    return {
      message: error.message,
      problem: error.problem,
      correlationId: error.correlationId,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Could not load workspace health.",
    problem: null,
    correlationId: null,
  };
}

/**
 * Sponsor-oriented **Workspace health**: five KPI blocks composed from existing governance, audit, compliance-drift, and pilot-value APIs (current scope only).
 */
export function SponsorWorkspaceHealthDashboard() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const callerRank = useNavCallerAuthorityRank();
  const [scopeBanner, setScopeBanner] = useState<string>(DEFAULT_SCOPE_FALLBACK);

  const bounds30d = useMemo(() => rollingBounds(30), []);
  const bounds90d = useMemo(() => rollingBounds(90), []);

  const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
  const projectId = scopeHeaders["x-project-id"]?.trim() ?? "";

  const dashboardQuery = useGovernanceDashboardQuery({
    maxPending: 50,
    maxDecisions: 50,
    maxChanges: 50,
    refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS,
  });
  const decisionsQuery = useGovernanceDecisionsNeededSummaryQuery({
    projectId: projectId.length > 0 ? projectId : undefined,
    refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS,
  });
  const driftQuery = useComplianceDriftTrendQuery({ refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS });
  const auditCountsQuery = useWorkspaceHealthPrecommitAuditCountsQuery({
    refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS,
  });
  const report30dQuery = usePilotValueReportQuery(bounds30d.fromUtc, bounds30d.toUtc, {
    refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS,
  });
  const report90dQuery = usePilotValueReportQuery(bounds90d.fromUtc, bounds90d.toUtc, {
    refetchIntervalMs: WORKSPACE_HEALTH_POLL_MS,
  });

  const refreshScopeBanner = useCallback(() => {
    const record = readOperatorScopeFromStorage();
    const headers = getEffectiveBrowserProxyScopeHeaders();

    setScopeBanner(
      formatSponsorWorkspaceScopeDescription(record, {
        tenantId: headers["x-tenant-id"] ?? "",
        workspaceId: headers["x-workspace-id"] ?? "",
        projectId: headers["x-project-id"] ?? "",
      }),
    );
  }, []);

  useEffect(() => {
    refreshScopeBanner();

    const onStorage = (e: StorageEvent): void => {
      if (e.key === "archlucid_operator_scope_v1") {
        refreshScopeBanner();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshScopeBanner);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshScopeBanner);
    };
  }, [refreshScopeBanner]);

  const loadError = useMemo((): WorkspaceHealthLoadError | null => {
    const queries = [
      dashboardQuery,
      decisionsQuery,
      driftQuery,
      auditCountsQuery,
      report30dQuery,
      report90dQuery,
    ];

    for (const query of queries) {
      if (query.isError) {
        return resolveWorkspaceHealthLoadError(query.error);
      }
    }

    return null;
  }, [
    auditCountsQuery.error,
    auditCountsQuery.isError,
    dashboardQuery.error,
    dashboardQuery.isError,
    decisionsQuery.error,
    decisionsQuery.isError,
    driftQuery.error,
    driftQuery.isError,
    report30dQuery.error,
    report30dQuery.isError,
    report90dQuery.error,
    report90dQuery.isError,
  ]);

  const isLoading =
    dashboardQuery.isPending
    || decisionsQuery.isPending
    || driftQuery.isPending
    || auditCountsQuery.isPending
    || report30dQuery.isPending
    || report90dQuery.isPending;

  const retryAll = (): void => {
    void dashboardQuery.refetch();
    void decisionsQuery.refetch();
    void driftQuery.refetch();
    void auditCountsQuery.refetch();
    void report30dQuery.refetch();
    void report90dQuery.refetch();
  };

  const layerHeader = (
    <LayerHeader
      pageKey="governance-dashboard"
      density={buyerPolishedShell ? "compact" : "default"}
    />
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-[1440px] space-y-4">
        {layerHeader}
        <SponsorWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
<p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {`Loading ${SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE.toLowerCase()}…`}
        </p>
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <div className="w-full max-w-[1440px] space-y-4">
        {layerHeader}
        <SponsorWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
<OperatorApiProblem
          fallbackMessage={loadError.message}
          problem={loadError.problem}
          correlationId={loadError.correlationId}
        />
        {buyerPolishedShell ? (
          <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Evaluation workspaces may not expose full KPI telemetry yet. Continue from{" "}
            <Link className={OPERATOR_LINK.nav} href="/governance/approval-queue">
              Resolve outcomes workflow
            </Link>{" "}
            for approvals and promotions.
          </p>
        ) : null}
        <Button type="button" variant="secondary" onClick={retryAll}>
          Retry
        </Button>
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const decisionsNeeded = decisionsQuery.data;
  const driftPoints = driftQuery.data ?? [];
  const blocked30d = auditCountsQuery.data?.blocked30d;
  const warned30d = auditCountsQuery.data?.warned30d;
  const report30d = report30dQuery.data;
  const report90d = report90dQuery.data;

  if (
    dashboard === undefined
    || decisionsNeeded === undefined
    || blocked30d === undefined
    || warned30d === undefined
    || report30d === undefined
    || report90d === undefined
  ) {
    return null;
  }

  const sla = computeWorkspaceHealthSlaStats(dashboard.pendingApprovals, dashboard.recentDecisions);

  const hoursFromBlocks = hoursSurfaced({
    critical: 0,
    high: 0,
    medium: 0,
    precommitBlocks: blocked30d.count,
  });

  const hoursFull30 = hoursSurfaced({
    critical: report30d.findingsBySeverity.critical,
    high: report30d.findingsBySeverity.high,
    medium: report30d.findingsBySeverity.medium,
    precommitBlocks: blocked30d.count,
  });

  const highRaw90 = report90d.findingsBySeverity.high;
  const criticalRaw90 = report90d.findingsBySeverity.critical;
  const highCritical90 =
    (typeof highRaw90 === "number" && Number.isFinite(highRaw90) ? highRaw90 : 0) +
    (typeof criticalRaw90 === "number" && Number.isFinite(criticalRaw90) ? criticalRaw90 : 0);

  const onTimePct =
    sla.onTimeDecisionRate === null ? " — " : `${Math.round(sla.onTimeDecisionRate * 100)}%`;

  const blockCountLabel = blocked30d.exact
    ? String(blocked30d.count)
    : `≥ ${blocked30d.count} (sampled lower bound; audit paging reached safety cap)`;

  const scopeBannerBlock =
    buyerPolishedShell ? (
      <details
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 shadow-sm dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="sponsor-workspace-health-session-scope"
      >
        <summary className="cursor-pointer font-semibold text-teal-900 dark:text-teal-100">
          {SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
        </summary>
        <p className="m-0 mt-2 leading-snug" role="status">
          {scopeBanner}
        </p>
      </details>
    ) : (
      <div
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 shadow-sm dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="sponsor-workspace-health-session-scope"
      >
        <p className="m-0 font-semibold text-teal-900 dark:text-teal-100">
          {SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
        </p>
        <p className="m-0 mt-1 leading-snug">{scopeBanner}</p>
      </div>
    );

  return (
    <div className="w-full max-w-[1440px] space-y-4">
      {layerHeader}

      <SponsorWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
{scopeBannerBlock}

      <DataArchivalDegradedBanner />

      <DecisionsNeededSummaryCard summary={decisionsNeeded} />

      <GovernanceBypassAuditPanel />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("preCommitOutcomes", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {buyerPolishedShell ? (
                <>
                  Rolling 30-day counts from audit-backed governance checkpoints — hard blocks vs monitored-risk signals
                  (non-blocking approval guidance).
                </>
              ) : (
                <>
                  Audit-backed counts via <span className="font-mono">GovernancePreCommitBlocked</span> and{" "}
                  <span className="font-mono">GovernancePreCommitWarned</span> in the rolling window.
                </>
              )}
            </p>
            <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                Blocked: <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{blockCountLabel}</span>{" "}
                <Link className={OPERATOR_LINK.nav} href={GOVERNANCE_AUDIT_PATH}>
                  {AUDIT_TRAIL_LABEL}
                </Link>
              </li>
              <li>
                {buyerPolishedShell ? "Monitored-risk signals" : "Warned"}
                {": "}
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                  {warned30d.exact ? warned30d.count : `≥ ${warned30d.count} (sampled lower bound)`}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("highCriticalExposure", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Pilot-value report severity totals in the window — exposure in the report period, not the same as an open-backlog
              aging inventory.
            </p>
            <p className={cn(
              "m-0 mt-2",
              buyerPolishedShell ? OPERATOR_TYPOGRAPHY.kpiValue : OPERATOR_TYPOGRAPHY.executiveDashboardMetric,
            )}>
              {finiteIntegerCountDisplay(highCritical90)}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link href="/governance/findings" className={OPERATOR_LINK.nav}>
                {buyerPolishedShell ? "Open risk register" : "Architecture risk register"}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 md:col-span-2">
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {executiveWorkspaceHealthKpiTitle("complianceDrift", buyerPolishedShell)}
              </h2>
              <Link href="/governance/approval-queue" className={OPERATOR_LINK.nav}>
                Resolve outcomes workflow
              </Link>
            </div>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Daily buckets (1440-minute) from compliance drift API.</p>
            <ComplianceDriftChartPdfExport points={driftPoints} />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {executiveWorkspaceHealthKpiTitle("approvalSla", buyerPolishedShell)}
            </h2>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Derived from workspace health pending approvals and recent terminal decisions.
            </p>
            <ul className={cn("m-0 mt-2 list-none space-y-1 p-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
              <li>Pending (sample cap): {dashboard.pendingCount}</li>
              <li>Overdue pending (with SLA deadline): {sla.overduePendingCount}</li>
              <li>On-track pending (with SLA deadline): {sla.onTrackPendingWithSlaCount}</li>
              <li>
                On-time decisions (reviewed on or before SLA, eligible n={sla.onTimeEligibleDecisions}): {onTimePct}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start gap-2">
              <h2 className={cn("m-0 flex-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {executiveWorkspaceHealthKpiTitle("valueProxy", buyerPolishedShell)}
              </h2>
              <FieldHelpTooltip
                label="the hours estimate"
                hint={
                  buyerPolishedShell ? (
                    <>
                      Estimated review-hours blend severity-weighted findings with an allowance per blocked merge attempt (
                      {HOURS_PER_PRECOMMIT_BLOCK} h each). Planning estimate — not measured wall-clock time.
                    </>
                  ) : (
                    <>
                      Estimated review-hours combine severity-weighted findings and {HOURS_PER_PRECOMMIT_BLOCK} h per blocked event (
                      <span className="font-mono">roi-assumptions.ts</span>). This is a planning estimate, not measured wall-clock time.
                    </>
                  )
                }
                triggerClassName="self-start"
              />
            </div>
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Blocks in 30d:{" "}
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                {blocked30d.exact ? blocked30d.count : `${blocked30d.count} (sampled)`}
              </span>
              . Full hours formula includes findings severities in the same window.
            </p>
            <p className={cn("m-0 mt-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
              {formatHours(hoursFull30)}
              <span className={cn("ml-2 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                (blocks alone: {formatHours(hoursFromBlocks)})
              </span>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link href="/insights/roi-summary" className={OPERATOR_LINK.nav}>
                See ROI report
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Full USD modeling lives on the ROI report
        {callerRank >= AUTHORITY_RANK.AdminAuthority ? "" : " (Admin-only loaded $/hour line)"}.
      </p>
    </div>
  );
}
