"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { buttonVariants } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import { ArchitectureObjectMapStrip } from "@/components/operator/ArchitectureObjectMapStrip";
import { ReviewAskDock } from "@/components/reviews/ReviewAskDock";
import { ReviewHeaderShareMenu } from "@/components/reviews/ReviewHeaderShareMenu";
import { ReviewWorkspaceStaleBanner } from "@/components/reviews/ReviewWorkspaceStaleBanner";
import { SampleReviewDemoBanner } from "@/components/reviews/SampleReviewDemoBanner";
import { useReviewsListReturnNavHref } from "@/hooks/use-reviews-list-return-nav-href";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { formatActionActorName } from "@/lib/action-actor-display";
import { CTA_WIDTH, DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { truncateRunId } from "@/components/governance/recurrence-schedules-presentation";
import { clampReviewWorkspaceH1Title } from "@/lib/review-display-title";
import {
  deriveReviewRecordMetadataContext,
  isReviewPipelineIncomplete,
  resolveReviewMetadataAbsentReasons,
} from "@/lib/run-detail-workspace-derive";
import { whyDisabledReviewHeaderActions } from "@/lib/why-disabled-cta";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

type ReviewMetadataField = {
  readonly key: string;
  readonly label: string;
  readonly value: string | null;
  readonly absentReason: string;
};

export type RunDetailWorkspaceHeaderProps = {
  readonly runId: string;
  readonly h1Title: string;
  readonly eyebrowLabel: string;
  readonly reviewIdentifierLabel: string;
  readonly signedReviewRecordId: string | null;
  readonly signedReviewRecordIdLabel: string | null;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly reviewOwner: string | null;
  readonly templateLabel: string | null;
  readonly finalizedAtLabel: string | null;
  readonly packageVersionLabel: string | null;
};

function buildReviewMetadataFields(
  props: RunDetailWorkspaceHeaderProps,
  absentReasons: ReturnType<typeof resolveReviewMetadataAbsentReasons>,
): readonly ReviewMetadataField[] {
  const reviewOwnerLabel = props.reviewOwner?.trim() ?? "";

  return [
    {
      key: "governance-decision-recorded-by",
      label: "Approval decision recorded by",
      value: reviewOwnerLabel.length > 0 ? formatActionActorName(reviewOwnerLabel) : null,
      absentReason: absentReasons.governanceDecisionRecordedBy,
    },
    {
      key: "review-template",
      label: "Review template",
      value: props.templateLabel,
      absentReason: absentReasons.reviewTemplate,
    },
    {
      key: "finalized-at",
      label: "Finalized at",
      value: props.finalizedAtLabel,
      absentReason: absentReasons.finalizedAt,
    },
    {
      key: "package-version",
      label: "Package version",
      value: props.packageVersionLabel,
      absentReason: absentReasons.packageVersion,
    },
  ];
}

function buildCollapseMetadataFields(
  props: RunDetailWorkspaceHeaderProps,
  absentReasons: ReturnType<typeof resolveReviewMetadataAbsentReasons>,
): readonly ReviewMetadataField[] {
  return [
    ...buildReviewMetadataFields(props, absentReasons),
    {
      key: "signed-review-record-id",
      label: "Finalized review record ID",
      value: props.signedReviewRecordIdLabel,
      absentReason: absentReasons.signedReviewRecordId,
    },
  ];
}

function renderMetadataField(field: ReviewMetadataField): React.JSX.Element {
  return (
    <div key={field.key}>
      <dt className="font-medium text-neutral-500 dark:text-neutral-400">{field.label}</dt>
      <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
        {field.value ?? field.absentReason}
      </dd>
    </div>
  );
}

function resolveMetadataDisclosureSummary(
  unrecordedFieldCount: number,
  metadataContext: ReturnType<typeof deriveReviewRecordMetadataContext>,
): string {
  if (metadataContext === "not-finalized") {
    return "Record metadata (pending finalization)";
  }

  return `Record metadata (${unrecordedFieldCount} fields not recorded)`;
}

function shouldShowReviewRecordMetadata(
  metadataContext: ReturnType<typeof deriveReviewRecordMetadataContext>,
  workspaceStatus: RunDetailWorkspaceStatus,
): boolean {
  if (metadataContext !== "not-finalized") {
    return true;
  }

  return !isReviewPipelineIncomplete(workspaceStatus);
}

/** Customer-facing review header — title and review identity without repeating sponsor metrics. */
export function RunDetailWorkspaceHeader(props: RunDetailWorkspaceHeaderProps): React.JSX.Element {
  const h1Title = clampReviewWorkspaceH1Title(props.h1Title);
  const reviewsListNavHref = useReviewsListReturnNavHref(REVIEWS_LIST_PATH);
  const metadataContext = deriveReviewRecordMetadataContext(props.signedReviewRecordId);
  const absentReasons = resolveReviewMetadataAbsentReasons(metadataContext);
  const metadataFields = buildReviewMetadataFields(props, absentReasons);
  const collapseMetadataFieldSet = buildCollapseMetadataFields(props, absentReasons);
  const unrecordedFieldCount = collapseMetadataFieldSet.filter((field) => field.value === null).length;
  const collapseMetadataFields = unrecordedFieldCount >= 3;
  const showReviewRecordMetadata = shouldShowReviewRecordMetadata(metadataContext, props.workspaceStatus);
  const reviewPipelineIncomplete = isReviewPipelineIncomplete(props.workspaceStatus);
  const headerActionDisabledReason = whyDisabledReviewHeaderActions(props.workspaceStatus);
  const metadataDisclosureSummary = resolveMetadataDisclosureSummary(
    unrecordedFieldCount,
    metadataContext,
  );

  return (
    <div data-testid="run-detail-workspace-header">
      <SampleReviewDemoBanner runId={props.runId} />
      <ReviewWorkspaceStaleBanner runId={props.runId} />
      <OperatorPageHeader
        navHref={reviewsListNavHref}
        title={h1Title}
        headingLevel="h1"
        subtitle={props.eyebrowLabel}
        metadata={
          <div
            className="flex min-w-0 flex-col gap-2"
            data-testid="run-detail-review-identifiers"
          >
            <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Review ID</span>
              <code
                className={cn("max-w-[14rem] truncate font-mono select-all", OPERATOR_TYPOGRAPHY.micro)}
                title={props.runId}
              >
                {truncateRunId(props.runId)}
              </code>
              <CopyIdButton value={props.runId} aria-label="Copy review ID" />
            </span>
            {props.signedReviewRecordId !== null ? (
              <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Finalized review record ID</span>
                <code
                  className={cn("max-w-[14rem] truncate font-mono select-all", OPERATOR_TYPOGRAPHY.micro)}
                  title={props.signedReviewRecordId}
                >
                  {truncateRunId(props.signedReviewRecordId)}
                </code>
                <CopyIdButton value={props.signedReviewRecordId} aria-label="Copy finalized review record ID" />
              </span>
            ) : null}
          </div>
        }
        actions={
          <>
            <ReviewHeaderShareMenu
              runId={props.runId}
              isCommitted={props.signedReviewRecordId !== null}
              findingsQueueHref={`/governance/findings?runId=${encodeURIComponent(props.runId)}`}
              disabled={reviewPipelineIncomplete}
              disabledReason={headerActionDisabledReason}
            />
            <ReviewAskDock
              runId={props.runId}
              reviewTitle={h1Title}
              disabled={reviewPipelineIncomplete}
              disabledReason={headerActionDisabledReason}
            />
            <FavoriteReviewToggle runId={props.runId} title={h1Title} size="sm" />
          </>
        }
      >
        <ArchitectureObjectMapStrip focus="review" />
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
          {showReviewRecordMetadata ? (
            collapseMetadataFields ? (
              <div className="sm:col-span-2 lg:col-span-2">
                <details
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800"
                  data-testid="run-detail-record-metadata-disclosure"
                >
                  <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {metadataDisclosureSummary}
                  </summary>
                  <div className="grid gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:grid-cols-2">
                    {collapseMetadataFieldSet.map(renderMetadataField)}
                  </div>
                </details>
              </div>
            ) : (
              metadataFields.map(renderMetadataField)
            )
          ) : null}
        </dl>
      </OperatorPageHeader>
    </div>
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
  /** When set, metrics are hidden because the pipeline has not produced assessable outcomes yet. */
  readonly suppressedReason?: string | null;
};

/** Compact first-viewport review status summary near the title. */
export function RunDetailWorkspaceSummaryStrip(
  props: RunDetailWorkspaceSummaryStripProps,
): React.JSX.Element {
  const suppressedReason = props.suppressedReason?.trim() ?? "";

  return (
    <section
      id="review-summary"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="run-detail-workspace-summary"
      aria-label="Decision snapshot"
    >
      <h2 className={cn("m-0 mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Decision snapshot
      </h2>
      {suppressedReason.length > 0 ? (
        <p
          className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-detail-workspace-summary-suppressed"
        >
          {suppressedReason}
        </p>
      ) : (
        <dl className={cn("m-0 grid gap-2 sm:grid-cols-2 lg:grid-cols-3", OPERATOR_TYPOGRAPHY.body)}>
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
      )}
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
