"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import { useGovernanceDashboardQuery } from "@/hooks/use-governance-dashboard-query";
import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";
import { usePilotValueReportQuery } from "@/hooks/use-pilot-value-report-query";
import { useWorkspaceHealthPrecommitAuditCountsQuery } from "@/hooks/use-workspace-health-precommit-audit-counts-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import { hoursSurfaced } from "@/lib/roi-assumptions";
import { formatSponsorWorkspaceScopeDescription } from "@/lib/workspace-health-scope-banner";
import { computeWorkspaceHealthSlaStats } from "@/lib/workspace-health-sla";
import type { AuditEventCountResult } from "@/lib/workspace-health-audit-count";
import type { ComplianceDriftTrendPoint, GovernanceDashboardSummary } from "@/types/governance-dashboard";

import {
  DEFAULT_SCOPE_FALLBACK,
  resolveWorkspaceHealthLoadError,
  rollingBounds,
  WORKSPACE_HEALTH_POLL_MS,
  type WorkspaceHealthLoadError,
} from "./sponsor-workspace-health-helpers";

export type SponsorWorkspaceHealthKpiViewModel = {
  readonly blocked30d: AuditEventCountResult;
  readonly warned30d: AuditEventCountResult;
  readonly highCritical90: number;
  readonly driftPoints: readonly ComplianceDriftTrendPoint[];
  readonly dashboard: GovernanceDashboardSummary;
  readonly sla: ReturnType<typeof computeWorkspaceHealthSlaStats>;
  readonly onTimePct: string;
  readonly blockCountLabel: string;
  readonly hoursFull30: number;
  readonly hoursFromBlocks: number;
};

export type UseSponsorWorkspaceHealthDashboardResult = {
  readonly buyerPolishedShell: boolean;
  readonly callerRank: number;
  readonly scopeBanner: string;
  readonly isLoading: boolean;
  readonly loadError: WorkspaceHealthLoadError | null;
  readonly retryAll: () => void;
  readonly decisionsNeeded: GovernanceDecisionsNeededSummary | undefined;
  readonly kpiViewModel: SponsorWorkspaceHealthKpiViewModel | null;
};

export function useSponsorWorkspaceHealthDashboard(): UseSponsorWorkspaceHealthDashboardResult {
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

  const retryAll = useCallback((): void => {
    void dashboardQuery.refetch();
    void decisionsQuery.refetch();
    void driftQuery.refetch();
    void auditCountsQuery.refetch();
    void report30dQuery.refetch();
    void report90dQuery.refetch();
  }, [
    auditCountsQuery,
    dashboardQuery,
    decisionsQuery,
    driftQuery,
    report30dQuery,
    report90dQuery,
  ]);

  const kpiViewModel = useMemo((): SponsorWorkspaceHealthKpiViewModel | null => {
    const dashboard = dashboardQuery.data;
    const blocked30d = auditCountsQuery.data?.blocked30d;
    const warned30d = auditCountsQuery.data?.warned30d;
    const report30d = report30dQuery.data;
    const report90d = report90dQuery.data;

    if (
      dashboard === undefined
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

    return {
      blocked30d,
      warned30d,
      highCritical90,
      driftPoints: driftQuery.data ?? [],
      dashboard,
      sla,
      onTimePct,
      blockCountLabel,
      hoursFull30,
      hoursFromBlocks,
    };
  }, [
    auditCountsQuery.data?.blocked30d,
    auditCountsQuery.data?.warned30d,
    dashboardQuery.data,
    driftQuery.data,
    report30dQuery.data,
    report90dQuery.data,
  ]);

  return {
    buyerPolishedShell,
    callerRank,
    scopeBanner,
    isLoading,
    loadError,
    retryAll,
    decisionsNeeded: decisionsQuery.data,
    kpiViewModel,
  };
}
