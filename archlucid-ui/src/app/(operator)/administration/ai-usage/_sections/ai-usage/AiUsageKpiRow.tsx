"use client";

import { cn } from "@/lib/utils";

import type { AiUsageKpiSummary } from "@/lib/ai-usage-dashboard-model";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly kpi: AiUsageKpiSummary;
  readonly loading: boolean;
};

function formatOptionalUsd(value: number | null, currency: string, approximate = false): string {
  if (value === null) {
    return "—";
  }

  const formatted = formatCostReportingEstimatedUsd(value, currency);

  return approximate ? `~${formatted}` : formatted;
}

function formatOptionalPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${value}%`;
}

function KpiCard(props: {
  readonly label: string;
  readonly value: string;
  readonly helper?: string;
  readonly testId: string;
}) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid={props.testId}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 text-xl font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.value}
      </p>
      {props.helper !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.helper}</p>
      ) : null}
    </div>
  );
}

export function AiUsageKpiRow(props: Props) {
  const { kpi, loading } = props;

  if (loading) {
    return (
      <div id="ai-usage-kpi-row">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="ai-usage-kpi-row-loading" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
    );
  }

  const changeLabel =
    kpi.changeVsPrior30DaysPercent === null
      ? undefined
      : `${kpi.changeVsPrior30DaysIsApproximate ? "Approx. " : ""}${kpi.changeVsPrior30DaysPercent >= 0 ? "+" : ""}${kpi.changeVsPrior30DaysPercent}% vs prior half of 30-day window`;

  return (
    <div id="ai-usage-kpi-row">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-testid="ai-usage-kpi-row">
      <KpiCard
        label="Used this month"
        value={formatOptionalUsd(kpi.usedThisMonthUsd, kpi.currency)}
        helper={
          kpi.daysRemainingInBillingPeriod !== null
            ? `${kpi.daysRemainingInBillingPeriod} days left in billing period`
            : undefined
        }
        testId="ai-usage-kpi-used"
      />
      <KpiCard
        label="Remaining budget"
        value={formatOptionalUsd(kpi.remainingBudgetUsd, kpi.currency)}
        helper={
          kpi.budgetTotalUsd !== null && kpi.remainingBudgetUsd !== null
            ? `$${kpi.remainingBudgetUsd.toFixed(2)} remaining of $${kpi.budgetTotalUsd.toFixed(2)}`
            : undefined
        }
        testId="ai-usage-kpi-remaining"
      />
      <KpiCard
        label="Budget used"
        value={formatOptionalPercent(kpi.budgetPercentUsed)}
        helper={changeLabel}
        testId="ai-usage-kpi-percent"
      />
      <KpiCard
        label="Projected month-end spend"
        value={formatOptionalUsd(kpi.projectedMonthEndUsd, kpi.currency, kpi.projectedIsApproximate)}
        helper={kpi.projectedIsApproximate ? "Estimate based on month-to-date pace" : undefined}
        testId="ai-usage-kpi-projected"
      />
      {kpi.highestCostProjectName !== null ? (
        <KpiCard
          label="Highest-cost project"
          value={kpi.highestCostProjectName}
          testId="ai-usage-kpi-top-project"
        />
      ) : null}
      {kpi.highestCostOperationName !== null ? (
        <KpiCard
          label="Highest-cost operation"
          value={kpi.highestCostOperationName}
          testId="ai-usage-kpi-top-operation"
        />
      ) : null}
      </div>
    </div>
  );
}
