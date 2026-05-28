"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { fetchAdminFleetLlmCogsDashboard, type AdminFleetLlmCogsDashboard } from "@/lib/trial-funnel-ops";

export function FleetLlmCogsPageClient() {
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
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="text-sm text-rose-800 dark:text-rose-200" role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="fleet-llm-cogs-page">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Fleet LLM COGS</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Per-tenant estimated UTC-month LLM pressure, budget cap utilization, and gross-margin risk labels. Values are
          estimates — not Azure invoice totals.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">UTC month {data?.utcMonth ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 pr-4 font-medium">Tenant</th>
                <th className="py-2 pr-4 font-medium">Est. pressure</th>
                <th className="py-2 pr-4 font-medium">Hard cap</th>
                <th className="py-2 pr-4 font-medium">Utilization</th>
                <th className="py-2 pr-4 font-medium">Risk</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
