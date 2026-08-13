"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AI_USAGE_BILLING_ESTIMATES_HONESTY } from "@/lib/vocabulary/ai-usage-billing-vocabulary";

export function AiUsageCostScopeHelp() {
  return (
    <details className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800" data-testid="ai-usage-cost-scope-help">
      <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        What do these cost figures mean?
      </summary>
      <div className={cn("mt-3 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <p className="m-0">
          Figures on this page are <strong>estimated usage costs</strong>, not final invoices. They reflect ArchLucid&apos;s
          internal metering of AI-assisted workflows for this workspace.
        </p>
        <p className="m-0">
          Totals may differ from your cloud provider console or reseller statements because credits, bundled allowances,
          and provider-side discounts are applied separately.
        </p>
        <p className="m-0">
          The billing period follows the <strong>UTC calendar month</strong>. Daily charts use a rolling 30-day window and
          refresh when you load or refresh this page.
        </p>
        <p className="m-0">
          Projected month-end spend is an approximate pace projection and should not be treated as a committed charge.
        </p>
      </div>
    </details>
  );
}

export function AiUsageEstimateHonestyLine() {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="ai-usage-estimate-honesty-line"
    >
      {AI_USAGE_BILLING_ESTIMATES_HONESTY}
    </p>
  );
}
