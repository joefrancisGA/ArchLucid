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
import { ReviewPresenterHeaderButton } from "@/components/reviews/ReviewPresenterHeaderButton";
import { ReviewRoomHeaderButton } from "@/components/reviews/ReviewRoomHeaderButton";
import { ReviewRoomElicitationShortcutHost } from "@/components/reviews/ReviewRoomElicitationShortcutHost";
import { ReviewWorkspaceStaleBanner } from "@/components/reviews/ReviewWorkspaceStaleBanner";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { SampleReviewDemoBanner } from "@/components/reviews/SampleReviewDemoBanner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useReviewsListReturnNavHref } from "@/hooks/use-reviews-list-return-nav-href";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { formatActionActorName } from "@/lib/action-actor-display";
import { CTA_WIDTH, DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { clampReviewWorkspaceH1Title } from "@/lib/review-display-title";
import {
  deriveReviewRecordMetadataContext,
  isReviewPipelineIncomplete,
  resolveReviewMetadataAbsentReasons,
} from "@/lib/run-detail-workspace-derive";
import { whyDisabledReviewHeaderActions } from "@/lib/why-disabled-cta";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import {
  parseRunDetailRecordMetadataOpenFromSearch,
  runDetailRecordMetadataHrefFromSearch,
} from "@/lib/runs/run-detail-record-metadata-url";

type ReviewMetadataField = {
  readonly key: string;
  readonly label: string;
  readonly value: string | null;
  readonly absentReason: string;
};

export type RunDetailWorkspaceHeaderProps = {
  readonly runId: string;
  readonly parentArchitectureId?: string | null;
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
    {
      key: "review-id",
      label: "Review ID",
      value: props.runId,
      absentReason: "Not recorded — review ID missing",
    },
    ...buildReviewMetadataFields(props, absentReasons),
    {
      key: "signed-review-record-id",
      label: "Finalized review record ID",
      value: props.signedReviewRecordIdLabel,
      absentReason: absentReasons.signedReviewRecordId,
    },
  ];
}

function renderMetadataField(
  field: ReviewMetadataField,
  signedReviewRecordId: string | null,
): React.JSX.Element {
  const copyableId =
    field.key === "review-id" && field.value !== null
      ? field.value
      : field.key === "signed-review-record-id" && signedReviewRecordId !== null
        ? signedReviewRecordId
        : null;

  return (
    <div key={field.key}>
      <dt className="font-medium text-neutral-500 dark:text-neutral-400">{field.label}</dt>
      <dd className="m-0 mt-1 text-neutral-800 dark:text-neutral-200">
        {field.value !== null ? (
          copyableId !== null ? (
            <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <code className={cn("break-all font-mono select-all", OPERATOR_TYPOGRAPHY.micro)}>
                {field.value}
              </code>
              <CopyIdButton
                value={copyableId}
                aria-label={field.key === "review-id" ? "Copy review ID" : "Copy finalized review record ID"}
              />
            </span>
          ) : (
            field.value
          )
        ) : (
          field.absentReason
        )}
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

  if (workspaceStatus.kind === "execution-failed") {
    return true;
  }

  return !isReviewPipelineIncomplete(workspaceStatus);
}

/** Customer-facing review header — title and review identity without repeating sponsor metrics. */
export function RunDetailWorkspaceHeader(props: RunDetailWorkspaceHeaderProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runRecordMetaOpenParam = searchParams.get("runRecordMetaOpen");
  const h1Title = clampReviewWorkspaceH1Title(props.h1Title);
  const reviewsListNavHref = useReviewsListReturnNavHref(REVIEWS_LIST_PATH);
  const [recordMetadataOpen, setRecordMetadataOpenState] = useState(() =>
    parseRunDetailRecordMetadataOpenFromSearch(runRecordMetaOpenParam),
  );

  const syncRecordMetadataOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        runDetailRecordMetadataHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRecordMetadataOpen = useCallback(
    (open: boolean) => {
      setRecordMetadataOpenState(open);
      syncRecordMetadataOpenToUrl(open);
    },
    [syncRecordMetadataOpenToUrl],
  );

  useEffect(() => {
    setRecordMetadataOpenState(parseRunDetailRecordMetadataOpenFromSearch(runRecordMetaOpenParam));
  }, [runRecordMetaOpenParam]);
  const metadataContext = deriveReviewRecordMetadataContext(props.signedReviewRecordId);
  const absentReasons = resolveReviewMetadataAbsentReasons(metadataContext);
  const collapseMetadataFieldSet = buildCollapseMetadataFields(props, absentReasons);
  const unrecordedFieldCount = collapseMetadataFieldSet.filter((field) => field.value === null).length;
  const showReviewRecordMetadata = shouldShowReviewRecordMetadata(metadataContext, props.workspaceStatus);
  const reviewPipelineIncomplete = isReviewPipelineIncomplete(props.workspaceStatus);
  const headerActionDisabledReason = whyDisabledReviewHeaderActions(props.workspaceStatus);
  const metadataDisclosureSummary = resolveMetadataDisclosureSummary(
    unrecordedFieldCount,
    metadataContext,
  );
  const shareActionsDisabledHintId = "review-header-share-disabled-hint";
  const askActionsDisabledHintId = "review-header-ask-disabled-hint";

  return (
    <div data-testid="run-detail-workspace-header">
      <SampleReviewDemoBanner runId={props.runId} />
      <ReviewWorkspaceStaleBanner runId={props.runId} />
      <OperatorPageHeader
        navHref={reviewsListNavHref}
        title={h1Title}
        headingLevel="h1"
        subtitle={props.eyebrowLabel}
        metadata={null}
        actions={
          <div className="flex min-w-0 flex-wrap items-start justify-end gap-2">
            <div
              className={cn(
                "flex min-w-0 flex-col items-end gap-1",
                reviewPipelineIncomplete ? "opacity-60" : undefined,
              )}
            >
              <ReviewHeaderShareMenu
                runId={props.runId}
                isCommitted={props.signedReviewRecordId !== null}
                manifestVersion={props.signedReviewRecordId}
                parentArchitectureId={props.parentArchitectureId}
                findingsQueueHref={`/governance/findings?runId=${encodeURIComponent(props.runId)}`}
                disabled={reviewPipelineIncomplete}
                disabledReason={headerActionDisabledReason}
                disabledDescribedById={
                  reviewPipelineIncomplete && headerActionDisabledReason !== null
                    ? shareActionsDisabledHintId
                    : undefined
                }
              />
              {reviewPipelineIncomplete && headerActionDisabledReason !== null ? (
                <WhyDisabledCtaHint
                  id={shareActionsDisabledHintId}
                  reason={headerActionDisabledReason}
                  testId="review-header-share-disabled-hint"
                  className="max-w-[14rem] text-right"
                />
              ) : null}
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-col items-end gap-1",
                reviewPipelineIncomplete ? "opacity-60" : undefined,
              )}
            >
              <ReviewAskDock
                runId={props.runId}
                reviewTitle={h1Title}
                disabled={reviewPipelineIncomplete}
                disabledReason={headerActionDisabledReason}
                disabledDescribedById={
                  reviewPipelineIncomplete && headerActionDisabledReason !== null
                    ? askActionsDisabledHintId
                    : undefined
                }
              />
              {reviewPipelineIncomplete && headerActionDisabledReason !== null ? (
                <WhyDisabledCtaHint
                  id={askActionsDisabledHintId}
                  reason={headerActionDisabledReason}
                  testId="review-header-ask-disabled-hint"
                  className="max-w-[14rem] text-right"
                />
              ) : null}
            </div>
            <ReviewRoomHeaderButton
              runId={props.runId}
              reviewCompleted={!reviewPipelineIncomplete}
              manifestVersion={props.signedReviewRecordId}
            />
            <ReviewPresenterHeaderButton
              runId={props.runId}
              reviewCompleted={!reviewPipelineIncomplete}
              manifestVersion={props.signedReviewRecordId}
            />
            <ReviewRoomElicitationShortcutHost />
            <FavoriteReviewToggle runId={props.runId} title={h1Title} size="sm" />
          </div>
        }
      >
        {!reviewPipelineIncomplete ? <ArchitectureObjectMapStrip focus="review" /> : null}
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
            <div className="sm:col-span-2 lg:col-span-3">
              <details
                className="rounded-lg border border-neutral-200 dark:border-neutral-800"
                data-testid="run-detail-record-metadata-disclosure"
                open={recordMetadataOpen}
                onToggle={(event) => {
                  setRecordMetadataOpen((event.currentTarget as HTMLDetailsElement).open);
                }}
              >
                <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {metadataDisclosureSummary}
                </summary>
                <div className="grid gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:grid-cols-2">
                  {collapseMetadataFieldSet.map((field) =>
                    renderMetadataField(field, props.signedReviewRecordId),
                  )}
                </div>
              </details>
            </div>
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
