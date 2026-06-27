"use client";

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
  fetchLlmMonthlyDollarBudgetStatusCached,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
import { OPERATOR_TYPOGRAPHY, operatorSemanticSurface } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
    <p
      className={cn("m-0 rounded-md border px-3 py-2", OPERATOR_TYPOGRAPHY.body, budgetToneClass(budget.disposition))}
      role="status"
      data-testid="llm-cost-command-center-budget-disposition"
    >
      <strong>Monthly AI budget: {dispositionLabel(budget.disposition)}</strong>
      {budget.utilizationPercent !== null ? (
        <span className="ml-2 tabular-nums">{Math.round(budget.utilizationPercent)}% of cap used</span>
      ) : null}
    </p>
  );
}

function SummaryGrid(props: { readonly summary: LlmCostCommandCenterSummary; readonly currency: string }) {
  const { summary, currency } = props;

  return (
    <dl className="m-0 grid gap-2 sm:grid-cols-2">
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>UTC month (est.)</dt>
        <dd className="m-0 text-lg font-semibold tabular-nums">{formatUsd(summary.utcMonthEstimatedUsd, currency)}</dd>
        <dd className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {formatTokens(summary.utcMonthPromptTokens)} prompt · {formatTokens(summary.utcMonthCompletionTokens)} completion tokens
        </dd>
      </div>
      <div>
        <dt className={cn("uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>UTC today (est.)</dt>
        <dd className="m-0 text-lg font-semibold tabular-nums">
          {summary.utcTodayEstimatedUsd !== null
            ? formatUsd(summary.utcTodayEstimatedUsd, currency)
            : "No bucket yet"}
        </dd>
        {summary.utcTodayPromptTokens !== null ? (
          <dd className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {formatTokens(summary.utcTodayPromptTokens)} prompt ·{" "}
            {formatTokens(summary.utcTodayCompletionTokens ?? 0)} completion tokens
          </dd>
        ) : null}
      </div>
      {summary.topWorkspaceProjectLabel !== null ? (
        <div className="sm:col-span-2">
          <dt className={cn("uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Top workspace / project</dt>
          <dd className="m-0 font-medium">{summary.topWorkspaceProjectLabel}</dd>
          {summary.topWorkspaceProjectEstimatedUsd !== null ? (
            <dd className={cn("m-0 tabular-nums text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {formatUsd(summary.topWorkspaceProjectEstimatedUsd, currency)} (30-day window)
            </dd>
          ) : null}
        </div>
      ) : null}
      {summary.topExpensiveRunId !== null ? (
        <div className="sm:col-span-2">
          <dt className={cn("uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Top expensive review</dt>
          <dd className={cn("m-0 font-medium font-mono", OPERATOR_TYPOGRAPHY.body)}>{summary.topExpensiveRunId}</dd>
          {summary.topExpensiveRunEstimatedUsd !== null ? (
            <dd className={cn("m-0 tabular-nums text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {formatUsd(summary.topExpensiveRunEstimatedUsd, currency)} estimated trace cost
            </dd>
          ) : null}
        </div>
      ) : null}
    </dl>
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
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.body}>Monthly AI usage</CardTitle>
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Estimated AI usage cost for the current UTC month — not invoiced Azure spend.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {budgetSummary !== null ? <BudgetDispositionBanner budget={budgetSummary} /> : null}
        <SummaryGrid summary={summary} currency={currency} />
      </CardContent>
    </Card>
  );
}
