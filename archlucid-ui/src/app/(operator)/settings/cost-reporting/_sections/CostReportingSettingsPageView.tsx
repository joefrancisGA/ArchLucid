"use client";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { EstimatedLlmCostBarChart } from "@/components/EstimatedLlmCostBarChart";
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
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Cost reporting not available in demo mode.</p>
        <p className="m-0 mt-1">Open this page in your production workspace to see estimated LLM costs.</p>
      </div>
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="cost-reporting-page">
        <p className="m-0 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="cost-reporting-page">
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
    <div className="mx-auto max-w-5xl space-y-6" data-testid="cost-reporting-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Cost reporting</h1>
          <ContextualHelp helpKey="settings-cost-reporting-page" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Aggregated LLM token usage and <strong>estimated cost</strong> (non-authoritative — reconcile with your cloud and billing
          systems). Related monthly band:{" "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/settings/tenant-cost">
            Tenant cost estimate
          </Link>
          .
        </p>
      </div>

      {data?.isMocked === true ? (
        <p
          className="m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
          data-testid="cost-reporting-mock-banner"
        >
          Showing <strong>sample estimated cost</strong> data — the reporting API is not available on this environment yet.
          Numbers are for layout only until <span className="font-mono text-xs">GET /v1/tenant/llm-cost-reporting</span>{" "}
          returns valid JSON.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated cost (last 30 days)</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Daily totals in {data?.currency ?? "USD"} — all figures are estimates.
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
          <CardTitle className="text-base">Estimated cost by workspace and project</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Breakdown over the same window — token counts are summed from provider usage records where available.
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
    </div>
  );
}
