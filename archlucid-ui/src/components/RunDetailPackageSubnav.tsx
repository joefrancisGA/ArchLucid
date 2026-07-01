"use client";

import Link from "next/link";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildRunDetailExecutiveSummaryHref,
  buildRunDetailPackageHref,
} from "@/lib/run-detail-package-subnav-paths";
import { cn } from "@/lib/utils";

export type RunDetailPackageSubnavActiveView = "review-package" | "executive-summary";

type RunDetailPackageSubnavProps = {
  readonly runId: string;
  readonly active: RunDetailPackageSubnavActiveView;
};

/** Persistent route tabs between review package detail and executive summary (TB-523). */
export function RunDetailPackageSubnav(props: RunDetailPackageSubnavProps) {
  const { runId, active } = props;
  const reviewHref = buildRunDetailPackageHref(runId);
  const executiveHref = buildRunDetailExecutiveSummaryHref(runId);

  return (
    <nav
      aria-label="Review package views"
      className="mb-3 flex flex-wrap gap-1 border-b border-neutral-200 pb-0 dark:border-neutral-800"
      data-testid="run-detail-package-subnav"
    >
      <Link
        href={reviewHref}
        aria-current={active === "review-package" ? "page" : undefined}
        className={cn(
          "px-3 py-2 font-medium leading-none outline-none transition-colors",
          OPERATOR_TYPOGRAPHY.body,
          "-mb-px border-b-2",
          active === "review-package"
            ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"
            : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
        )}
      >
        Review package
      </Link>
      <Link
        href={executiveHref}
        aria-current={active === "executive-summary" ? "page" : undefined}
        className={cn(
          "px-3 py-2 font-medium leading-none outline-none transition-colors",
          OPERATOR_TYPOGRAPHY.body,
          "-mb-px border-b-2",
          active === "executive-summary"
            ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"
            : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
        )}
      >
        {BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle}
      </Link>
    </nav>
  );
}
