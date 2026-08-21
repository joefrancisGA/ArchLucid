"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiUsageBudgetPaceStatus, AiUsageKpiSummary } from "@/lib/ai-usage-dashboard-model";
import {
  formatAiUsageRemainingBudgetCopy,
  formatAiUsageUsedBudgetCopy,
} from "@/lib/ai-usage-dashboard-model";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { formatUtcBillingMonthLabel } from "@/lib/llm-cost-reporting-display-labels";
import { OPERATOR_CARD, OPERATOR_LINK, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly kpi: AiUsageKpiSummary;
  readonly paceStatus: AiUsageBudgetPaceStatus;
  readonly paceLabel: string;
  readonly warningThresholdPercent: number | null;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly canManageBudget: boolean;
  readonly onRetry?: () => void;
};

function paceToneClass(status: AiUsageBudgetPaceStatus): string {
  if (status === "exhausted" || status === "at_risk") {
    return operatorSemanticSurface("blocked");
  }

  if (status === "approaching_limit") {
    return operatorSemanticSurface("warn");
  }

  if (status === "inactive") {
    return "border-neutral-200 bg-neutral-50 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/40";
  }

  return operatorSemanticSurface("ready");
}

function progressToneClass(status: AiUsageBudgetPaceStatus): string {
  if (status === "exhausted" || status === "at_risk") {
    return "bg-rose-600 dark:bg-rose-500";
  }

  if (status === "approaching_limit") {
    return "bg-amber-500 dark:bg-amber-400";
  }

  return "bg-teal-700 dark:bg-teal-500";
}

export function AiUsageMonthlyBudgetPanel(props: Props) {
  const usedUsd = props.kpi.usedThisMonthUsd ?? 0;
  const totalUsd = props.kpi.budgetTotalUsd;
  const remainingUsd = props.kpi.remainingBudgetUsd;
  const percentUsed = props.kpi.budgetPercentUsed ?? 0;
  const labelId = "ai-usage-monthly-budget-label";

  const budgetSummaryCopy =
    totalUsd !== null && remainingUsd !== null
      ? formatAiUsageRemainingBudgetCopy(remainingUsd, totalUsd)
      : totalUsd !== null
        ? formatAiUsageUsedBudgetCopy(usedUsd, totalUsd)
        : null;

  return (
    <Card data-testid="ai-usage-monthly-budget-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly AI budget</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Workspace AI budget utilization for the current UTC billing month.
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        <AiUsageSectionState
          state={props.state}
          title="Monthly AI budget"
          testId="ai-usage-monthly-budget-state"
          onRetry={props.onRetry}
          inactiveMessage="Monthly AI budget monitoring is not enabled for this workspace."
          permissionMessage="Monthly budget status requires Execute authority. Usage estimates above remain visible."
        >
          <div
            className={cn("rounded-md border px-3 py-2", OPERATOR_TYPOGRAPHY.body, paceToneClass(props.paceStatus))}
            role="status"
            data-testid="ai-usage-budget-pace-status"
          >
            <p className="m-0 font-medium">{props.paceLabel}</p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{formatUtcBillingMonthLabel()}</p>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p id={labelId} className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {budgetSummaryCopy ?? "Budget summary unavailable"}
              </p>
              <p className={cn("m-0 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)} aria-live="polite">
                {props.kpi.budgetPercentUsed !== null ? `${props.kpi.budgetPercentUsed}% used` : " — "}
              </p>
            </div>
            <Progress
              value={percentUsed}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentUsed}
              aria-labelledby={labelId}
              indicatorClassName={progressToneClass(props.paceStatus)}
              className="mt-2"
            />
          </div>

          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className="text-al-text-secondary">Used</dt>
              <dd className="m-0 font-medium tabular-nums text-al-text-primary">
                {formatCostReportingEstimatedUsd(usedUsd, props.kpi.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Remaining</dt>
              <dd className="m-0 font-medium tabular-nums text-al-text-primary">
                {remainingUsd !== null ? formatCostReportingEstimatedUsd(remainingUsd, props.kpi.currency) : " — "}
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Warning threshold</dt>
              <dd className="m-0 font-medium tabular-nums text-al-text-primary">
                {props.warningThresholdPercent !== null ? `${props.warningThresholdPercent}%` : " — "}
              </dd>
            </div>
            <div>
              <dt className="text-al-text-secondary">Projected month-end spend</dt>
              <dd className="m-0 font-medium tabular-nums text-al-text-primary">
                {props.kpi.projectedMonthEndUsd !== null
                  ? `~${formatCostReportingEstimatedUsd(props.kpi.projectedMonthEndUsd, props.kpi.currency)}`
                  : " — "}
              </dd>
            </div>
          </dl>

          {props.canManageBudget ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Change monthly limits, warning thresholds, and hard-stop behavior in{" "}
              <span className="font-medium text-al-text-primary">Budget controls</span> below.
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Budget changes require Admin authority.{" "}
              <Link href="/administration/billing" className={OPERATOR_LINK.nav}>
                Open billing settings
              </Link>
              .
            </p>
          )}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
