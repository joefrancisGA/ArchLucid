"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageBreakdownRow } from "@/lib/ai-usage-dashboard-model";
import type { AiUsageBreakdownGroupBy } from "@/lib/ai-usage-dashboard-filters";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/settings/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly rows: readonly AiUsageBreakdownRow[];
  readonly currency: string;
  readonly groupBy: AiUsageBreakdownGroupBy;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly onGroupByChange: (groupBy: AiUsageBreakdownGroupBy) => void;
};

const GROUP_OPTIONS: readonly { readonly id: AiUsageBreakdownGroupBy; readonly label: string }[] = [
  { id: "project", label: "Project" },
  { id: "workspace", label: "Workspace" },
  { id: "operation", label: "Operation type" },
  { id: "model", label: "Model" },
  { id: "user", label: "User" },
  { id: "run", label: "Review run" },
];

function groupByLabel(groupBy: AiUsageBreakdownGroupBy): string {
  return GROUP_OPTIONS.find((option) => option.id === groupBy)?.label ?? "Group";
}

export function AiUsageCostBreakdownPanel(props: Props) {
  return (
    <Card data-testid="ai-usage-cost-breakdown-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Cost breakdown</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Estimated cost attribution for the selected grouping. Some dimensions require recent activity data.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Breakdown grouping">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cn(
                "rounded-md border px-2.5 py-1",
                OPERATOR_TYPOGRAPHY.helper,
                props.groupBy === option.id
                  ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-neutral-200 text-al-text-secondary hover:text-al-text-primary dark:border-neutral-700",
              )}
              aria-pressed={props.groupBy === option.id}
              onClick={() => props.onGroupByChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className={OPERATOR_CARD.content}>
        <AiUsageSectionState
          state={props.state}
          title="cost breakdown"
          testId="ai-usage-cost-breakdown-state"
          emptyTitle={`No ${groupByLabel(props.groupBy).toLowerCase()} usage recorded`}
          emptyDescription="Once AI-assisted workflows run, attributed costs will appear in this breakdown."
        >
          {props.rows.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              No attributed costs are available for the selected grouping yet.
            </p>
          ) : null}
          {props.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 uppercase text-neutral-500 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Usage count</th>
                    <th className="py-2 pr-3">Tokens</th>
                    <th className="py-2 pr-3">Estimated cost</th>
                    <th className="py-2 pr-3">% of total</th>
                    <th className="py-2 pr-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {props.rows.map((row) => (
                    <tr key={row.key} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 font-medium text-al-text-primary">{row.name}</td>
                      <td className="py-2 pr-3 tabular-nums text-al-text-secondary">{row.usageCount.toLocaleString()}</td>
                      <td className={cn("py-2 pr-3 font-mono tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                        {(row.promptTokens + row.completionTokens).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-al-text-primary">
                        {formatCostReportingEstimatedUsd(row.estimatedCostUsd, props.currency)}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-al-text-secondary">{row.percentOfTotal}%</td>
                      <td className="py-2 pr-3">
                        {row.detailHref !== null ? (
                          <Link href={row.detailHref} className={OPERATOR_LINK.nav}>
                            View
                          </Link>
                        ) : (
                          <span className="text-al-text-secondary">—</span>
                        )}
                      </td>
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
