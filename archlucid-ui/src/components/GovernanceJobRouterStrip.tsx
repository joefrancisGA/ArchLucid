"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  getGovernanceJobRouter,
  type GovernanceJobId,
  type GovernanceJobRouter,
  type GovernanceJobRouterOption,
} from "@/lib/governance-job-router";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceJobRouterStripProps = {
  /** Highlights the job that matches the current governance home. */
  readonly currentJobId: GovernanceJobId;
  readonly className?: string;
  /** Optional override for tests; defaults to {@link getGovernanceJobRouter}. */
  readonly router?: GovernanceJobRouter;
};

function GovernanceJobRouterCard(props: {
  readonly option: GovernanceJobRouterOption;
  readonly isCurrent: boolean;
}): JSX.Element {
  const { option, isCurrent } = props;

  if (isCurrent) {
    return (
      <div
        aria-current="page"
        className={cn(
          "min-w-0 flex-1 rounded-md border bg-al-surface-raised px-3 py-2",
          "border-[var(--al-accent-interactive)] ring-1 ring-[var(--al-accent-interactive)]/35",
        )}
        data-testid={`governance-job-router-option-${option.id}`}
        data-current="true"
      >
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}>
          {option.label}
        </p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {option.whenToUse}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={option.href}
      className={cn(
        "min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 no-underline transition-colors",
        "hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900",
      )}
      data-testid={`governance-job-router-option-${option.id}`}
      data-current="false"
      prefetch
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_LINK.step, OPERATOR_TYPOGRAPHY.helper)}>
        {option.label}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {option.whenToUse}
      </p>
    </Link>
  );
}

/**
 * TB-2199 / TB-2230 - compact "which job am I doing?" triad chooser
 * (Approval queue, findings queue, Decision register).
 */
export function GovernanceJobRouterStrip(props: GovernanceJobRouterStripProps): JSX.Element {
  const router = props.router ?? getGovernanceJobRouter();

  return (
    <section
      className={cn(
        "mb-4 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="governance-job-router-heading"
      data-testid="governance-job-router"
      data-current-job={props.currentJobId}
    >
      <h2
        id="governance-job-router-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {router.heading}
      </h2>
      {/* Three equal cards on sm+; stack on narrow viewports so when-to-use copy stays readable. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {router.options.map((option) => (
          <GovernanceJobRouterCard
            key={option.id}
            option={option}
            isCurrent={option.id === props.currentJobId}
          />
        ))}
      </div>
    </section>
  );
}