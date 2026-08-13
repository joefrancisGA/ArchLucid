"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type AiUsageQuietEmptyPeriodPanelProps = {
  readonly budgetTotalUsd: number | null;
  readonly currency: string;
  readonly canManageBudget: boolean;
  readonly billingPeriodResetLabel: string | null;
};

function formatBudgetCap(budgetTotalUsd: number | null, currency: string): string | null {
  if (budgetTotalUsd === null || !Number.isFinite(budgetTotalUsd)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length > 0 ? currency : "USD",
      maximumFractionDigits: 0,
    }).format(budgetTotalUsd);
  } catch {
    return `$${budgetTotalUsd.toFixed(0)}`;
  }
}

/**
 * Primary story when the billing period has no recorded AI spend — avoids a zeroed analytics cockpit.
 */
export function AiUsageQuietEmptyPeriodPanel(props: AiUsageQuietEmptyPeriodPanelProps) {
  const capLabel = formatBudgetCap(props.budgetTotalUsd, props.currency);

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      role="status"
      data-testid="ai-usage-period-zero-state"
    >
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>No AI usage this billing period</h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Once reviews, evidence checks, or Q&amp;A workflows run, this page will show budget utilization, daily trends,
        and attributed activity.
      </p>
      {capLabel !== null ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="ai-usage-quiet-budget-cap">
          Workspace monthly AI budget cap: <span className="font-medium text-al-text-primary">{capLabel}</span>.
        </p>
      ) : null}
      {props.billingPeriodResetLabel !== null ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="ai-usage-quiet-period-reset">
          Budget period resets on <span className="font-medium text-al-text-primary">{props.billingPeriodResetLabel}</span>.
        </p>
      ) : null}
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href="/administration/billing" data-testid="ai-usage-quiet-billing-link">
          Open billing
        </Link>
        {props.canManageBudget
          ? " · Review budget controls below when you need to change the cap or hard-stop behavior."
          : null}
      </p>
    </section>
  );
}
