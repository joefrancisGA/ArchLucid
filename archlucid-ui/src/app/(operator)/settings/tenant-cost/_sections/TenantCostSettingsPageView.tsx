"use client";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";

import type { UseTenantCostSettingsPageModel } from "./use-tenant-cost-settings-page";

type TenantCostSettingsPageViewProps = {
  model: UseTenantCostSettingsPageModel;
};

export function TenantCostSettingsPageView({ model }: TenantCostSettingsPageViewProps) {
  const { estimate, failure, loading } = model;

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
        <div className="space-y-3" aria-busy aria-label="Loading cost estimate">
          <div className="h-4 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="h-3 w-full max-w-md animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-4 h-3 w-[90%] animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-3 w-[85%] animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-3 w-[72%] animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
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
