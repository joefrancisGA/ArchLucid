"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  getGovernanceJobRouter,
  type GovernanceJobId,
  type GovernanceJobRouter,
  type GovernanceJobRouterOption,
} from "@/lib/governance/governance-job-router";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceJobRouterStripProps = {
  /** Highlights the job that matches the current governance home. */
  readonly currentJobId: GovernanceJobId;
  readonly className?: string;
  /** Optional override for tests; defaults to {@link getGovernanceJobRouter}. */
  readonly router?: GovernanceJobRouter;
  /** Compact inline chooser for child routes that already name the current job in the page header. */
  readonly layout?: "default" | "compact";
};

function GovernanceJobRouterCard(props: {
  readonly option: GovernanceJobRouterOption;
  readonly isCurrent: boolean;
}): JSX.Element {
  const { option, isCurrent } = props;
  const labelClassName = cn(OPERATOR_TYPOGRAPHY.body, "m-0 font-medium", OPERATOR_LINK.nav);
  const helperClassName = cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper);

  if (isCurrent) {
    return (
      <Link
        href={option.href}
        aria-current="page"
        className={cn(
          "block min-w-0 flex-1 rounded-md border bg-al-surface-raised px-3 py-2 no-underline",
          "border-[var(--al-accent-interactive)] ring-1 ring-[var(--al-accent-interactive)]/35",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
        )}
        data-testid={`governance-job-router-option-${option.id}`}
        data-current="true"
        prefetch={false}
      >
        <p className={labelClassName}>{option.label}</p>
        <p className={helperClassName}>{option.whenToUse}</p>
      </Link>
    );
  }

  return (
    <Link
      href={option.href}
      className={cn(
        "block min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 no-underline transition-colors",
        "hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900",
      )}
      data-testid={`governance-job-router-option-${option.id}`}
      data-current="false"
      prefetch
    >
      <p className={labelClassName}>{option.label}</p>
      <p className={helperClassName}>{option.whenToUse}</p>
    </Link>
  );
}

/**
 * TB-2199 / TB-2230 - compact "which job am I doing?" triad chooser
 * (Approval queue, findings queue, Decision register).
 */
export function GovernanceJobRouterStrip(props: GovernanceJobRouterStripProps): JSX.Element {
  const router = props.router ?? getGovernanceJobRouter();
  const layout = props.layout ?? "default";
  const isCompact = layout === "compact";
  const visibleOptions = isCompact
    ? router.options.filter((option) => option.id !== props.currentJobId)
    : router.options;

  return (
    <section
      className={cn(
        isCompact
          ? "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
          : "mb-4 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby={isCompact ? undefined : "governance-job-router-heading"}
      aria-label={isCompact ? "Other governance queues" : undefined}
      data-testid="governance-job-router"
      data-current-job={props.currentJobId}
      data-layout={layout}
    >
      {isCompact ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 text-al-text-secondary")}>Other governance queues</p>
      ) : (
        <h2
          id="governance-job-router-heading"
          className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
        >
          {router.heading}
        </h2>
      )}
      <ul
        className="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row sm:items-stretch"
        role="list"
      >
        {visibleOptions.map((option) => (
          <li key={option.id} className="min-w-0 flex-1">
            <GovernanceJobRouterCard option={option} isCurrent={option.id === props.currentJobId} />
          </li>
        ))}
      </ul>
    </section>
  );
}
