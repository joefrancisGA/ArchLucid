"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { NavDerivedPageIcon } from "@/components/PageHeading";
import { CopyIdButton } from "@/components/CopyIdButton";
import { buttonVariants } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { CTA_WIDTH, DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

const NOT_RECORDED_LABEL = "Not recorded";

export type RunDetailWorkspaceHeaderProps = {
  readonly runId: string;
  readonly h1Title: string;
  readonly eyebrowLabel: string;
  readonly reviewIdentifierLabel: string;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly reviewOwner: string | null;
  readonly templateLabel: string | null;
  readonly finalizedAtLabel: string | null;
  readonly packageVersionLabel: string | null;
};

/** Customer-facing review header — title and review identity without repeating executive metrics. */
export function RunDetailWorkspaceHeader(props: RunDetailWorkspaceHeaderProps): React.JSX.Element {
  return (
    <header
      className="space-y-3 border-b border-neutral-200 pb-5 dark:border-neutral-800"
      data-testid="run-detail-workspace-header"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <NavDerivedPageIcon navHref={REVIEWS_LIST_PATH} />
          <div className="min-w-0 flex-1 space-y-1">
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {props.eyebrowLabel}
            </p>
            <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
              {props.h1Title}
            </h1>
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-600 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-1">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Review ID</span>
                <code className="max-w-[14rem] truncate font-mono select-all">{props.reviewIdentifierLabel}</code>
                <CopyIdButton value={props.runId} aria-label="Copy review ID" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <FavoriteReviewToggle runId={props.runId} title={props.h1Title} size="sm" />
          <PageContextualHelpButton />
        </div>
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
        <div>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Review owner</dt>
          <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
            {props.reviewOwner ?? NOT_RECORDED_LABEL}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Review template</dt>
          <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
            {props.templateLabel ?? NOT_RECORDED_LABEL}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Finalized at</dt>
          <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
            {props.finalizedAtLabel ?? NOT_RECORDED_LABEL}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-500 dark:text-neutral-400">Package version</dt>
          <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
            {props.packageVersionLabel ?? NOT_RECORDED_LABEL}
          </dd>
        </div>
      </dl>
    </header>
  );
}

export type RunDetailWorkspaceSummaryStripProps = {
  readonly outcomeHeading: string;
  readonly reviewOutcome: string;
  readonly highestUnresolvedSeverity: string | null;
  readonly findingsSummaryLine: string;
  readonly evidenceCoverageLine: string;
  readonly primaryConcern: string | null;
  readonly materialSeverityLine?: string | null;
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
          <dd className="m-0 mt-0.5">
            {props.highestUnresolvedSeverity !== null ? (
              <SeverityTag severity={props.highestUnresolvedSeverity} />
            ) : (
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">None</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Evidence coverage</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.evidenceCoverageLine}
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
        {props.materialSeverityLine !== null && props.materialSeverityLine !== undefined ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Material severity (critical and high)</dt>
            <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {props.materialSeverityLine}
              <span className="ml-1 font-normal text-neutral-500 dark:text-neutral-400">
                (subset of open findings above)
              </span>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export type RunDetailWorkspaceBlockingBannerProps = {
  readonly blockingCount: number;
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
      className={cn(DESIGN_TOKENS.callout.blocked, "px-4 py-3")}
      data-testid="run-detail-blocking-approval-banner"
      role="status"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {label}
      </p>
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
        <Link className={cn(buttonVariants({ variant: "default" }), CTA_WIDTH.content)} href={props.href}>
          {props.label}
        </Link>
      ) : (
        <button className={cn(buttonVariants({ variant: "default" }), CTA_WIDTH.content)} type="button">
          {props.label}
        </button>
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
