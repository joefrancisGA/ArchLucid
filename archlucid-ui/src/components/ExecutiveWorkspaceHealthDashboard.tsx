"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { ComplianceDriftChartPdfExport } from "@/components/ComplianceDriftChartPdfExport";
import { DecisionsNeededSummaryCard } from "@/components/governance/DecisionsNeededSummaryCard";
import { GovernanceBypassAuditPanel } from "@/components/governance/GovernanceBypassAuditPanel";
import { DataArchivalDegradedBanner } from "@/components/governance/DataArchivalDegradedBanner";
import { ExecutiveWorkspaceHealthPageHero } from "@/components/governance/ExecutiveWorkspaceHealthPageHero";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  getComplianceDriftTrend,
  getGovernanceDashboard,
} from "@/lib/api";
import { getGovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
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
import { formatExecutiveWorkspaceScopeDescription } from "@/lib/workspace-health-scope-banner";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";
import { computeWorkspaceHealthSlaStats } from "@/lib/workspace-health-sla";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  executiveWorkspaceHealthKpiTitle,
  EXECUTIVE_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY,
} from "@/lib/executive-workspace-health-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { ComplianceDriftTrendPoint, GovernanceDashboardSummary } from "@/types/governance-dashboard";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

function rollingBounds(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

type LoadState =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      dashboard: GovernanceDashboardSummary;
      driftPoints: ComplianceDriftTrendPoint[];
      blocked30d: { count: number; exact: boolean };
      warned30d: { count: number; exact: boolean };
      report30d: PilotValueReportJson;
      report90d: PilotValueReportJson;
      decisionsNeeded: GovernanceDecisionsNeededSummary;
    }
  | { status: "error"; message: string; problem: ApiProblemDetails | null; correlationId: string | null };

const DEFAULT_SCOPE_FALLBACK =
  "Figures use the authenticated tenant / workspace / project sent with each request — the same boundaries as governance and audit. Not a cross-workspace rollup.";

/**
 * Sponsor-oriented **Executive Workspace Health**: five KPI blocks composed from existing governance, audit, compliance-drift, and pilot-value APIs (current scope only).
 */
export function ExecutiveWorkspaceHealthDashboard() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const callerRank = useNavCallerAuthorityRank();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [scopeBanner, setScopeBanner] = useState<string>(DEFAULT_SCOPE_FALLBACK);

  const refreshScopeBanner = useCallback(() => {
    const record = readOperatorScopeFromStorage();
    const headers = getEffectiveBrowserProxyScopeHeaders();

    setScopeBanner(
      formatExecutiveWorkspaceScopeDescription(record, {
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

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const b30 = rollingBounds(30);
    const b90 = rollingBounds(90);

    try {
      const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
      const projectId = scopeHeaders["x-project-id"]?.trim() ?? "";

      const [dashboard, driftPoints, blocked30d, warned30d, report30d, report90d, decisionsNeeded] =
        await Promise.all([
        getGovernanceDashboard(50, 50, 50),
        getComplianceDriftTrend(b30.fromUtc, b30.toUtc, 1440),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: b30.fromUtc,
          toUtcIso: b30.toUtc,
        }),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitWarned",
          fromUtcIso: b30.fromUtc,
          toUtcIso: b30.toUtc,
        }),
        fetchPilotValueReportJson(b30.fromUtc, b30.toUtc),
        fetchPilotValueReportJson(b90.fromUtc, b90.toUtc),
        getGovernanceDecisionsNeededSummary(projectId.length > 0 ? projectId : undefined),
      ]);

      setState({
        status: "ready",
        dashboard,
        driftPoints,
        blocked30d,
        warned30d,
        report30d,
        report90d,
        decisionsNeeded,
      });
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setState({
          status: "error",
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load workspace health.",
          problem: null,
          correlationId: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [load]);

  const layerHeader = (
    <LayerHeader
      pageKey="governance-dashboard"
      density={buyerPolishedShell ? "compact" : "default"}
    />
  );

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="w-full max-w-[1440px] space-y-4">
        {layerHeader}
        <ExecutiveWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
<p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedShell ? "Loading workspace overview…" : "Loading executive workspace health…"}
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="w-full max-w-[1440px] space-y-4">
        {layerHeader}
        <ExecutiveWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
<OperatorApiProblem
          fallbackMessage={state.message}
          problem={state.problem}
          correlationId={state.correlationId}
        />
        {buyerPolishedShell ? (
          <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Evaluation workspaces may not expose full KPI telemetry yet. Continue from{" "}
            <Link className={OPERATOR_LINK.nav} href="/governance/approval-queue">
              Governance workflow
            </Link>{" "}
            for approvals and promotions.
          </p>
        ) : null}
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (state.status !== "ready") {
    return null;
  }

  const { dashboard, driftPoints, blocked30d, warned30d, report30d, report90d, decisionsNeeded } = state;

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
    sla.onTimeDecisionRate === null ? "—" : `${Math.round(sla.onTimeDecisionRate * 100)}%`;

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
        data-testid="executive-workspace-health-session-scope"
      >
        <summary className="cursor-pointer font-semibold text-teal-900 dark:text-teal-100">
          {EXECUTIVE_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
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
        data-testid="executive-workspace-health-session-scope"
      >
        <p className="m-0 font-semibold text-teal-900 dark:text-teal-100">
          {EXECUTIVE_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
        </p>
        <p className="m-0 mt-1 leading-snug">{scopeBanner}</p>
      </div>
    );

  return (
    <div className="w-full max-w-[1440px] space-y-4">
      {layerHeader}

      <ExecutiveWorkspaceHealthPageHero buyerPolishedShell={buyerPolishedShell} />
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
                  (non-blocking pre-commit guidance).
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
                  Audit log
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
                Governance workflow
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
              Derived from governance dashboard pending approvals and recent terminal decisions.
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
