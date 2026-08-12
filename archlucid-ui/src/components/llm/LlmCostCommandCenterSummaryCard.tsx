"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildLlmBudgetCommandCenterSummary,
  type LlmBudgetCommandCenterSummary,
} from "@/lib/llm-cost-command-center-budget";
import {
  buildLlmCostCommandCenterSummary,
  type LlmCostCommandCenterSummary,
} from "@/lib/llm-cost-command-center-summary";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";
import {
  formatUtcBillingMonthLabel,
  formatUtcTodayLabel,
} from "@/lib/llm-cost-reporting-display-labels";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";

function formatUsd(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function budgetToneClass(disposition: LlmBudgetCommandCenterSummary["disposition"]): string {
  if (disposition === "HOLD") {
    return operatorSemanticSurface("blocked");
  }

  if (disposition === "WARN") {
    return operatorSemanticSurface("warn");
  }

  return operatorSemanticSurface("ready");
}

function dispositionLabel(disposition: LlmBudgetCommandCenterSummary["disposition"]): string {
  if (disposition === "HOLD") {
    return "At limit";
  }

  if (disposition === "WARN") {
    return "Approaching limit";
  }

  return "Within limit";
}

function BudgetDispositionBanner(props: { readonly budget: LlmBudgetCommandCenterSummary }) {
  const { budget } = props;

  return (
    <div
      className={cn("rounded-md border px-3 py-2", OPERATOR_TYPOGRAPHY.body, budgetToneClass(budget.disposition))}
      role="status"
      data-testid="llm-cost-command-center-budget-disposition"
    >
      <p className="m-0 font-medium">Monthly budget: {dispositionLabel(budget.disposition)}</p>
      {budget.utilizationPercent !== null ? (
        <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.helper)}>
          {Math.round(budget.utilizationPercent)}% used
        </p>
      ) : null}
    </div>
  );
}

function SummaryMetric(props: {
  readonly label: string;
  readonly sublabel?: string;
  readonly estimatedCost: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800">
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.label}</p>
      {props.sublabel !== undefined ? (
        <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.sublabel}</p>
      ) : null}
      <p className={cn("m-0 mt-2 text-xl font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.estimatedCost}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {formatTokens(props.promptTokens)} prompt tokens · {formatTokens(props.completionTokens)} completion tokens
      </p>
    </div>
  );
}

function SummaryGrid(props: { readonly summary: LlmCostCommandCenterSummary; readonly currency: string }) {
  const { summary, currency } = props;
  const billingMonthLabel = formatUtcBillingMonthLabel();
  const todayLabel = formatUtcTodayLabel();

  return (
    <div className="space-y-4">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {billingMonthLabel}. Usage is calculated by UTC billing month.
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryMetric
          label="Month to date"
          sublabel={billingMonthLabel}
          estimatedCost={formatUsd(summary.utcMonthEstimatedUsd, currency)}
          promptTokens={summary.utcMonthPromptTokens}
          completionTokens={summary.utcMonthCompletionTokens}
        />
        <SummaryMetric
          label="Today"
          sublabel={todayLabel}
          estimatedCost={
            summary.utcTodayEstimatedUsd !== null ? formatUsd(summary.utcTodayEstimatedUsd, currency) : formatUsd(0, currency)
          }
          promptTokens={summary.utcTodayPromptTokens ?? 0}
          completionTokens={summary.utcTodayCompletionTokens ?? 0}
        />
        {summary.topWorkspaceName !== null ? (
          <SummaryMetric
            label="Top workspace / project"
            sublabel={`Workspace: ${summary.topWorkspaceName}${
              summary.topProjectName !== null ? ` · Project: ${summary.topProjectName}` : ""
            }`}
            estimatedCost={
              summary.topWorkspaceProjectEstimatedUsd !== null
                ? formatUsd(summary.topWorkspaceProjectEstimatedUsd, currency)
                : formatUsd(0, currency)
            }
            promptTokens={summary.topWorkspaceProjectPromptTokens}
            completionTokens={summary.topWorkspaceProjectCompletionTokens}
          />
        ) : (
          <SummaryMetric
            label="Top workspace / project"
            sublabel="No usage recorded yet"
            estimatedCost={formatUsd(0, currency)}
            promptTokens={0}
            completionTokens={0}
          />
        )}
      </div>
    </div>
  );
}

/** Operator LLM cost command-center rollup (assessment #14). */
export function LlmCostCommandCenterSummaryCard(props: {
  readonly dashboard: LlmCostReportingDashboard | null;
}): ReactElement | null {
  const summary = buildLlmCostCommandCenterSummary(props.dashboard);
  const [budgetStatus, setBudgetStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const status = await fetchLlmMonthlyDollarBudgetStatusCached();

        if (!cancelled) {
          setBudgetStatus(status);
        }
      } catch {
        if (!cancelled) {
          setBudgetStatus(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (summary === null) {
    return null;
  }

  const currency = props.dashboard?.currency ?? "USD";
  const budgetSummary = buildLlmBudgetCommandCenterSummary(budgetStatus);

  return (
    <Card data-testid="llm-cost-command-center-summary">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Monthly usage summary</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Estimated AI usage for the current billing month.
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          These figures are usage estimates and are not invoices.
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
        {budgetSummary !== null ? <BudgetDispositionBanner budget={budgetSummary} /> : null}
        <SummaryGrid summary={summary} currency={currency} />
      </CardContent>
    </Card>
  );
}
