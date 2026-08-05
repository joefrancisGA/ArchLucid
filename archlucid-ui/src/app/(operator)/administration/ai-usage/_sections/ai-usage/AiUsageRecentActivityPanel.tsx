"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageActivityRow } from "@/lib/ai-usage-dashboard-model";
import { buildAiUsageActivityCsv } from "@/lib/ai-usage-dashboard-model";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_CARD, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly rows: readonly AiUsageActivityRow[];
  readonly currency: string;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly canExport: boolean;
};

function triggerBadgeClass(trigger: AiUsageActivityRow["triggerBadge"]): string {
  switch (trigger) {
    case "Scheduled":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100";
    case "Manual":
      return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100";
    case "Skipped":
      return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
    case "Evidence check":
      return "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100";
    case "Retry":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100";
    default: {
      const never: never = trigger;
      return never;
    }
  }
}

function statusClass(status: AiUsageActivityRow["status"]): string {
  switch (status) {
    case "Budget blocked":
      return "text-rose-800 dark:text-rose-200";
    case "Skipped":
      return "text-neutral-600 dark:text-neutral-300";
    case "Failed":
      return "text-rose-800 dark:text-rose-200";
    case "Running":
      return "text-sky-800 dark:text-sky-200";
    default:
      return "text-al-text-primary";
  }
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AiUsageRecentActivityPanel(props: Props) {
  return (
    <Card data-testid="ai-usage-recent-activity-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Recent AI activity</CardTitle>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Recent AI-consuming operations with estimated cost, trigger type, and budget impact.
            </p>
          </div>
          {props.canExport && props.rows.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadCsv("ai-usage-activity.csv", buildAiUsageActivityCsv(props.rows))}
              data-testid="ai-usage-export-activity"
            >
              Export usage
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        <AiUsageSectionState
          state={props.state}
          title="recent AI activity"
          testId="ai-usage-recent-activity-state"
          emptyTitle="No recent AI activity"
          emptyDescription="Recent AI-consuming operations will appear here with operation type, model, initiator, and whether the event used budget."
        >
          {props.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 uppercase text-neutral-500 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Date / time</th>
                    <th className="py-2 pr-3">Operation</th>
                    <th className="py-2 pr-3">Model</th>
                    <th className="py-2 pr-3">Initiated by</th>
                    <th className="py-2 pr-3">Trigger</th>
                    <th className="py-2 pr-3">Estimated cost</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Budget impact</th>
                  </tr>
                </thead>
                <tbody>
                  {props.rows.map((row) => (
                    <tr key={row.key} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 whitespace-nowrap text-al-text-secondary">
                        {new Date(row.occurredUtc).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-al-text-primary">{row.operationLabel}</td>
                      <td className="py-2 pr-3 text-al-text-secondary">{row.modelLabel}</td>
                      <td className="py-2 pr-3 text-al-text-secondary">{row.initiatedByLabel}</td>
                      <td className="py-2 pr-3">
                        <span className={cn("inline-flex rounded px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge, triggerBadgeClass(row.triggerBadge))}>
                          {row.triggerBadge}
                        </span>
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-al-text-primary">
                        {formatCostReportingEstimatedUsd(row.estimatedCostUsd, props.currency)}
                      </td>
                      <td className={cn("py-2 pr-3 font-medium", statusClass(row.status))}>{row.status}</td>
                      <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.budgetUsedLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
