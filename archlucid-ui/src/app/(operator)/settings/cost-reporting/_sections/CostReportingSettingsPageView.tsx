"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EstimatedLlmCostBarChart } from "@/components/EstimatedLlmCostBarChart";
import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";
import { LlmCostCommandCenterSummaryCard } from "@/components/LlmCostCommandCenterSummaryCard";
import { OperatorOutboxDiagnosticsCard } from "@/components/OperatorOutboxDiagnosticsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatCostReportingEstimatedUsd } from "./cost-reporting-page-helpers";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";

type Props = {
  readonly model: CostReportingSettingsPageViewModel;
};

export function CostReportingSettingsPageView(props: Props) {
  const m = props.model;

  if (m.surface === "demo") {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="AI usage and cost"
        description="In a connected tenant, administrators review estimated AI usage costs and budget utilization here."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
        <p className="m-0 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="cost-reporting-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  const data = m.data;

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">AI usage and cost</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Track estimated AI usage cost for this workspace. These figures are usage estimates, not invoices.
          Reconcile with Azure Cost Management or your reseller statements for billing truth.
        </p>
      </div>

      {data?.isMocked === true ? (
        <p
          className="m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50"
          role="status"
          data-testid="cost-reporting-mock-banner"
        >
          Showing <strong>sample estimated cost</strong> data — the reporting API is not available on this environment
          yet. Numbers are for layout only.
        </p>
      ) : null}

      <LlmCostCommandCenterSummaryCard dashboard={data} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly AI budget</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            UTC-month hard cap usage. Bar turns amber when nearing the configured warn threshold and red at the hard cap.
          </p>
        </CardHeader>
        <CardContent>
          <LlmBudgetUtilizationMeter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily AI usage (last 30 days)</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Daily estimated cost totals in {data?.currency ?? "USD"} — all figures are estimates.
          </p>
        </CardHeader>
        <CardContent>
          {m.loading ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}
          {!m.loading && data !== null ? (
            <EstimatedLlmCostBarChart daily={data.daily} currencyCode={data.currency} />
          ) : null}
          {!m.loading && data === null ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Could not load cost reporting.</p>
          ) : null}
          {!m.loading && data !== null ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void m.load()}>
                Refresh
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage by workspace and project</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Breakdown over the same 30-day window — token counts are summed from provider usage records where available.
          </p>
        </CardHeader>
        <CardContent>
          {!m.loading && data !== null && data.byWorkspaceProject.length === 0 ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No workspace/project rows returned.</p>
          ) : null}
          {!m.loading && data !== null && data.byWorkspaceProject.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Workspace</th>
                    <th className="py-2 pr-3">Project</th>
                    <th className="py-2 pr-3">Estimated cost</th>
                    <th className="py-2 pr-3">Prompt tokens</th>
                    <th className="py-2 pr-3">Completion tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byWorkspaceProject.map((row) => {
                    const key = `${row.workspaceId}:${row.projectId}`;

                    return (
                      <tr key={key} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-3 font-medium text-neutral-900 dark:text-neutral-100">
                          {row.workspaceName}
                        </td>
                        <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">{row.projectName}</td>
                        <td className="py-2 pr-3 text-neutral-800 dark:text-neutral-200">
                          {formatCostReportingEstimatedUsd(row.estimatedCostUsd, data.currency)}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {row.promptTokens.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {row.completionTokens.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="group">
        <summary className="cursor-pointer list-none">
          <span className="text-sm font-medium text-neutral-700 underline decoration-dotted underline-offset-2 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100">
            Related diagnostics
          </span>
          <span className="ml-1 text-xs text-neutral-500 group-open:hidden">(processing queues and dead-letter health)</span>
        </summary>
        <div className="mt-4">
          <OperatorOutboxDiagnosticsCard />
        </div>
      </details>
    </div>
  );
}
