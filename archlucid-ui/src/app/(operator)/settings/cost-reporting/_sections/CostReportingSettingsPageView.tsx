"use client";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { EstimatedLlmCostBarChart } from "@/components/EstimatedLlmCostBarChart";
import { LlmBudgetUtilizationMeter } from "@/components/LlmBudgetUtilizationMeter";
import { LlmCostCommandCenterSummaryCard } from "@/components/LlmCostCommandCenterSummaryCard";
import { OperatorOutboxDiagnosticsCard } from "@/components/OperatorOutboxDiagnosticsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatCostReportingEstimatedUsd } from "./cost-reporting-page-helpers";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="cost-reporting-forbidden">
          This page requires workspace access (ReadAuthority). Sign in with a workspace-scoped account or API key.
        </p>
      </div>
    );
  }

  const data = m.data;

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>AI usage and cost</h1>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Track estimated AI usage cost for this workspace. These figures are usage estimates, not invoices.
          Reconcile with Azure Cost Management or your reseller statements for billing truth.
        </p>
      </div>

      {data?.isMocked === true ? (
        <p
          className={cn(
            "m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly AI budget</CardTitle>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            UTC-month hard cap usage. Bar turns amber when nearing the configured warn threshold and red at the hard cap.
          </p>
        </CardHeader>
        <CardContent>
          <LlmBudgetUtilizationMeter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Daily AI usage (last 30 days)</CardTitle>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Daily estimated cost totals in {data?.currency ?? "USD"} — all figures are estimates.
          </p>
        </CardHeader>
        <CardContent>
          {m.loading ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p> : null}
          {!m.loading && data !== null ? (
            <EstimatedLlmCostBarChart daily={data.daily} currencyCode={data.currency} />
          ) : null}
          {!m.loading && data === null ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Could not load cost reporting.</p>
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Usage by workspace and project</CardTitle>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Breakdown over the same 30-day window — token counts are summed from provider usage records where available.
          </p>
        </CardHeader>
        <CardContent>
          {!m.loading && data !== null && data.byWorkspaceProject.length === 0 ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>No workspace/project rows returned.</p>
          ) : null}
          {!m.loading && data !== null && data.byWorkspaceProject.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 uppercase text-neutral-500 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
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
                        <td className={cn("py-2 pr-3 font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                          {row.promptTokens.toLocaleString()}
                        </td>
                        <td className={cn("py-2 pr-3 font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
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
          <span className={cn("font-medium text-neutral-700 underline decoration-dotted underline-offset-2 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Related diagnostics
          </span>
          <span className={cn("ml-1 group-open:hidden", OPERATOR_TYPOGRAPHY.helper)}>(processing queues and dead-letter health)</span>
        </summary>
        <div className="mt-4">
          <OperatorOutboxDiagnosticsCard />
        </div>
      </details>
    </div>
  );
}
