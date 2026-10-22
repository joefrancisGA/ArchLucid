"use client";

import { cn } from "@/lib/utils";

import {
  BUYER_VALUE_REPORT_INCLUDES_ITEMS,
  BUYER_VALUE_REPORT_INCLUDES_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Lists sponsor-report sections so users know what exports contain before data exists. */
export function ValueReportIncludesSection(): React.JSX.Element {
  return (
    <section
      className={cn("space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800", DESIGN_TOKENS.surface.card)}
      data-testid="value-report-includes"
      aria-labelledby="value-report-includes-heading"
    >
      <h2 id="value-report-includes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_VALUE_REPORT_INCLUDES_TITLE}
      </h2>
      <ul className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_VALUE_REPORT_INCLUDES_ITEMS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-al-text-secondary">
            <span aria-hidden="true" className="mt-0.5 text-al-text-secondary dark:text-neutral-300">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
