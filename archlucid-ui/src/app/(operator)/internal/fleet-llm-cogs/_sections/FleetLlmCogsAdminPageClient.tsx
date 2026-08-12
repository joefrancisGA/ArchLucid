"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { EnterpriseTableSkeletonRows } from "@/components/ui/enterprise-table-skeleton-rows";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FLEET_LLM_COGS_PAGE_LEAD, FLEET_LLM_COGS_PAGE_TITLE } from "@/lib/fleet-llm-cogs-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { fetchAdminFleetLlmCogsDashboard, type AdminFleetLlmCogsDashboard } from "@/lib/trial-funnel-ops";

export function FleetLlmCogsAdminPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [data, setData] = useState<AdminFleetLlmCogsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchAdminFleetLlmCogsDashboard();
      setData(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fleet LLM COGS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

  if (isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className={cn("w-full max-w-[1440px]", OPERATOR_LAYOUT.sectionStack)} data-testid="fleet-llm-cogs-page">
      <OperatorPageHeader
        headingLevel="h1"
        title={FLEET_LLM_COGS_PAGE_TITLE}
        subtitle={FLEET_LLM_COGS_PAGE_LEAD}
        actions={
          <RefreshButton busy={loading} onClick={() => void refresh()} />
        }
      />

      {error ? (
        <OperatorSectionLoadFailure
          message={error}
          retryLabel="Reload fleet COGS"
          retrying={loading}
          testId="fleet-llm-cogs-load-failure"
          onRetry={() => void refresh()}
        />
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>UTC month {data?.utcMonth ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-4 overflow-x-auto", OPERATOR_TYPOGRAPHY.body)}>
          <div className={cn("grid gap-3 sm:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Monitoring</p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {data?.monthlyBudgetMonitoringActive ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Cost rates</p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {data?.costRatesConfigured ? "Configured" : "Missing"}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Near threshold</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.cardTitle)}>{data?.budgetWarningTenantCount ?? 0}</p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Hard stops</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.cardTitle)}>{data?.hardStopTenantCount ?? 0}</p>
            </div>
          </div>
          <EnterpriseTable ariaLabel="Fleet LLM cost of goods sold by tenant">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Tenant</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Est. pressure</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Hard cap</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Utilization</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Budget completeness</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {loading && (data?.rows ?? []).length === 0 ? (
                <EnterpriseTableSkeletonRows
                  columns={6}
                  label="Loading fleet COGS…"
                  testId="fleet-llm-cogs-skeleton"
                />
              ) : null}
              {(data?.rows ?? []).map((row) => (
                <EnterpriseTableRow key={row.tenantId}>
                  <EnterpriseTableCell>{row.tenantName}</EnterpriseTableCell>
                  <EnterpriseTableCell className="tabular-nums">
                    ${row.estimatedUsdPressureUtcMonth.toFixed(2)}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="tabular-nums">
                    {row.hardCapUsdUtcMonth != null ? `$${row.hardCapUsdUtcMonth.toFixed(2)}` : "—"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell className="tabular-nums">
                    {row.hardCapUtilizationFraction != null
                      ? `${Math.round(row.hardCapUtilizationFraction * 100)}%`
                      : "—"}
                  </EnterpriseTableCell>
                  <EnterpriseTableCell>{row.grossMarginRiskLabel}</EnterpriseTableCell>
                  <EnterpriseTableCell>
                    <span className={row.costRatesConfigured ? "" : "font-medium text-amber-800 dark:text-amber-200"}>
                      {row.budgetCompletionLabel}
                    </span>
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </CardContent>
      </Card>
    </div>
  );
}
