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
import { OPERATOR_CARD, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { hasWorkspaceProjectUsage } from "@/lib/llm-cost-reporting-display-labels";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";

type Props = {
  readonly model: CostReportingSettingsPageViewModel;
};

export function CostReportingSettingsPageView(props: Props) {
  const m = props.model;
  const showUsageDiagnostics = isArchLucidInternalOperatorShellEnv();

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
  const tableHasUsage = data !== null && hasWorkspaceProjectUsage(data.byWorkspaceProject);

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>AI usage and cost</h1>
        <p className={cn("mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Track estimated AI usage and cost for this workspace. Billing totals may differ from provider invoices or
          reseller statements.
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
          Showing <strong>sample usage data</strong> for layout preview — connect a live tenant for actual reporting.
        </p>
      ) : null}

      <LlmCostCommandCenterSummaryCard dashboard={data} />

      <Card>
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly AI budget</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Workspace AI budget utilization for the current billing month.
          </p>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          <LlmBudgetUtilizationMeter />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Daily AI usage (last 30 days)</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Daily usage trend for the selected workspace.
          </p>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          {m.loading ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p> : null}
          {!m.loading && data !== null ? (
            <EstimatedLlmCostBarChart daily={data.daily} currencyCode={data.currency} />
          ) : null}
          {!m.loading && data === null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Could not load usage reporting.</p>
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
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Usage by workspace and project</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Breakdown for the last 30 days in {data?.currency ?? "USD"}.
          </p>
        </CardHeader>
        <CardContent className={OPERATOR_CARD.content}>
          {!m.loading && data !== null && !tableHasUsage ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No AI usage recorded for this workspace during the selected period.
            </p>
          ) : null}
          {!m.loading && data !== null && tableHasUsage ? (
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
                        <td className="py-2 pr-3 font-medium text-al-text-primary">{row.workspaceName}</td>
                        <td className="py-2 pr-3 text-al-text-secondary">{row.projectName}</td>
                        <td className="py-2 pr-3 tabular-nums text-al-text-primary">
                          {formatCostReportingEstimatedUsd(row.estimatedCostUsd, data.currency)}
                        </td>
                        <td className={cn("py-2 pr-3 font-mono tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                          {row.promptTokens.toLocaleString()}
                        </td>
                        <td className={cn("py-2 pr-3 font-mono tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
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

      {showUsageDiagnostics ? (
        <details className="group">
          <summary className="cursor-pointer list-none">
            <span className={cn("font-medium text-al-text-secondary underline decoration-dotted underline-offset-2 hover:text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              View usage diagnostics
            </span>
            <span className={cn("ml-1 group-open:hidden", OPERATOR_TYPOGRAPHY.helper)}>(internal support queues)</span>
          </summary>
          <div className="mt-4">
            <OperatorOutboxDiagnosticsCard />
          </div>
        </details>
      ) : null}
    </div>
  );
}
