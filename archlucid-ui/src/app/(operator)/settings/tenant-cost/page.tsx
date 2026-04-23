"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { getTenantCostEstimate } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";

export default function TenantCostSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [estimate, setEstimate] = useState<TenantCostEstimateResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const data = await getTenantCostEstimate();
      setEstimate(data);
    } catch (e) {
      setEstimate(null);
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tenant cost estimate</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Non-authoritative monthly band from configured list prices. Reconcile against Azure Cost Management and your
          Stripe or Marketplace invoices before quoting externally.
        </p>
      </div>

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
      ) : estimate === null ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No estimate loaded.</p>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tier <span className="font-medium text-neutral-900 dark:text-neutral-100">{estimate.tier}</span> —{" "}
            <span className="font-mono text-neutral-900 dark:text-neutral-100">
              {estimate.currency} {estimate.estimatedMonthlyUsdLow.toFixed(0)} –{" "}
              {estimate.estimatedMonthlyUsdHigh.toFixed(0)} / month
            </span>
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {estimate.factors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">{estimate.methodologyNote}</p>
        </div>
      )}
    </div>
  );
}
