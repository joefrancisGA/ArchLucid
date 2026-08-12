"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { AiUsageActivityRow } from "@/lib/ai-usage-dashboard-model";
import { buildAiUsageActivityCsv } from "@/lib/ai-usage-dashboard-model";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
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
            <EnterpriseTable ariaLabel="Recent AI activity">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Date / time</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Operation</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Model</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Initiated by</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Trigger</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Estimated cost</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Budget impact</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {props.rows.map((row) => (
                  <EnterpriseTableRow key={row.key}>
                    <EnterpriseTableCell className="whitespace-nowrap text-al-text-secondary">
                      {formatInstantForLocale(row.occurredUtc)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="text-al-text-primary">{row.operationLabel}</EnterpriseTableCell>
                    <EnterpriseTableCell className="text-al-text-secondary">{row.modelLabel}</EnterpriseTableCell>
                    <EnterpriseTableCell className="text-al-text-secondary">{row.initiatedByLabel}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className={cn("inline-flex rounded px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge, triggerBadgeClass(row.triggerBadge))}>
                        {row.triggerBadge}
                      </span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums text-al-text-primary">
                      {formatCostReportingEstimatedUsd(row.estimatedCostUsd, props.currency)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className={cn("font-medium", statusClass(row.status))}>{row.status}</EnterpriseTableCell>
                    <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.budgetUsedLabel}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
