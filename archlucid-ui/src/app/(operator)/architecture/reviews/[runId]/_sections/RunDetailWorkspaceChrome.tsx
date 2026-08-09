"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

export type RunDetailWorkspaceHeaderProps = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly systemName: string | null;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly reviewOwner: string | null;
  readonly templateLabel: string | null;
};

/** Customer-facing review header — title and review identity without repeating executive metrics. */
export function RunDetailWorkspaceHeader(props: RunDetailWorkspaceHeaderProps): React.JSX.Element {
  return (
    <header
      className="space-y-3 border-b border-neutral-200 pb-5 dark:border-neutral-800"
      data-testid="run-detail-workspace-header"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Architecture review
          </p>
          <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
            {props.reviewTitle}
          </h1>
          {props.systemName !== null ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">System: </span>
              {props.systemName}
            </p>
          ) : null}
        </div>
        <PageContextualHelpButton />
      </div>

      <dl
        className={cn(
          "m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        <div>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Review status</dt>
          <dd className="m-0 mt-1">
            <StatusTag kind={props.workspaceStatus.statusTagKind} label={props.workspaceStatus.label} />
          </dd>
        </div>
        {props.reviewOwner !== null ? (
          <div>
            <dt className="font-medium text-neutral-500 dark:text-neutral-400">Review owner</dt>
            <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">{props.reviewOwner}</dd>
          </div>
        ) : null}
        {props.templateLabel !== null ? (
          <div>
            <dt className="font-medium text-neutral-500 dark:text-neutral-400">Review template</dt>
            <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">{props.templateLabel}</dd>
          </div>
        ) : null}
      </dl>
</header>
  );
}

export type RunDetailWorkspaceSummaryStripProps = {
  readonly outcomeHeading: string;
  readonly reviewOutcome: string;
  readonly highestUnresolvedSeverity: string | null;
  readonly findingsSummaryLine: string;
  readonly primaryConcern: string | null;
  readonly nextAction: string;
  readonly materialSeverityLine?: string | null;
  readonly nextActionHref?: string | null;
};

/** Compact first-viewport review status summary near the title. */
export function RunDetailWorkspaceSummaryStrip(
  props: RunDetailWorkspaceSummaryStripProps,
): React.JSX.Element {
  return (
    <section
      id="review-summary"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="run-detail-workspace-summary"
      aria-label="Decision snapshot"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Decision snapshot
      </h2>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">{props.outcomeHeading}</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">{props.reviewOutcome}</dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Highest unresolved severity</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.highestUnresolvedSeverity ?? "None"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500 dark:text-neutral-400">Findings</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.findingsSummaryLine}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500 dark:text-neutral-400">Primary concern</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.primaryConcern ?? "No unresolved findings"}
          </dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-neutral-500 dark:text-neutral-400">Next action</dt>
          <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">
            <span>{props.nextAction}</span>
            {props.nextActionHref !== null && props.nextActionHref !== undefined ? (
              <Button variant="outline" size="sm" asChild className="ml-3 mt-2 sm:mt-0">
                <Link href={props.nextActionHref}>Open findings</Link>
              </Button>
            ) : null}
          </dd>
        </div>
        {props.materialSeverityLine !== null && props.materialSeverityLine !== undefined ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Material severity (critical and high)</dt>
            <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {props.materialSeverityLine}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export type RunDetailWorkspaceBlockingBannerProps = {
  readonly blockingCount: number;
  readonly findingsTabHref: string;
};

export function RunDetailWorkspaceBlockingBanner(
  props: RunDetailWorkspaceBlockingBannerProps,
): React.JSX.Element | null {
  if (props.blockingCount <= 0) {
    return null;
  }

  const verb = props.blockingCount === 1 ? "blocks" : "block";
  const label = `${props.blockingCount} unresolved finding${props.blockingCount === 1 ? "" : "s"} currently ${verb} approval.`;

  return (
    <div
      className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
      data-testid="run-detail-blocking-approval-banner"
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
          {label}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={props.findingsTabHref}>Review blocking findings</Link>
        </Button>
      </div>
    </div>
  );
}

export type RunDetailWorkspacePrimaryActionProps = {
  readonly label: string;
  readonly href: string | null;
  readonly commitBlockedReason: string | null;
};

export function RunDetailWorkspacePrimaryAction(
  props: RunDetailWorkspacePrimaryActionProps,
): React.JSX.Element {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-workspace-primary-action"
    >
      <p className={cn("m-0 mb-2 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Recommended next step
      </p>
      {props.commitBlockedReason !== null ? (
        <p className={cn("m-0 mb-2 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
          {props.commitBlockedReason}
        </p>
      ) : null}
      {props.href !== null ? (
        <Button asChild className="w-full">
          <Link href={props.href}>{props.label}</Link>
        </Button>
      ) : (
        <Button className="w-full" type="button">
          {props.label}
        </Button>
      )}
    </div>
  );
}

export type RunDetailWorkspaceSeverityRailProps = {
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
};

export function RunDetailWorkspaceSeverityRail(
  props: RunDetailWorkspaceSeverityRailProps,
): React.JSX.Element {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-severity-rail"
    >
      <p className={cn("m-0 mb-2 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Findings by severity
      </p>
      <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        <li className="flex justify-between gap-2">
          <span>Critical</span>
          <span className="font-semibold tabular-nums">{props.criticalCount}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>High</span>
          <span className="font-semibold tabular-nums">{props.highCount}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Medium</span>
          <span className="font-semibold tabular-nums">{props.mediumCount}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Low</span>
          <span className="font-semibold tabular-nums">{props.lowCount}</span>
        </li>
      </ul>
    </div>
  );
}

