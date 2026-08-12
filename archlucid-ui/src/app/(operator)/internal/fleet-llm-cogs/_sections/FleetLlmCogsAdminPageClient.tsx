"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <div className="w-full max-w-[1440px] space-y-6" data-testid="fleet-llm-cogs-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>{FLEET_LLM_COGS_PAGE_TITLE}</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {FLEET_LLM_COGS_PAGE_LEAD}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
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
          <table className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
            <thead>
              <tr className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                <th className="py-2 pr-4">Tenant</th>
                <th className="py-2 pr-4">Est. pressure</th>
                <th className="py-2 pr-4">Hard cap</th>
                <th className="py-2 pr-4">Utilization</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4">Budget completeness</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((row) => (
                <tr key={row.tenantId} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-4">{row.tenantName}</td>
                  <td className="py-2 pr-4 tabular-nums">${row.estimatedUsdPressureUtcMonth.toFixed(2)}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {row.hardCapUsdUtcMonth != null ? `$${row.hardCapUsdUtcMonth.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    {row.hardCapUtilizationFraction != null
                      ? `${Math.round(row.hardCapUtilizationFraction * 100)}%`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4">{row.grossMarginRiskLabel}</td>
                  <td className="py-2 pr-4">
                    <span className={row.costRatesConfigured ? "" : "font-medium text-amber-800 dark:text-amber-200"}>
                      {row.budgetCompletionLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
