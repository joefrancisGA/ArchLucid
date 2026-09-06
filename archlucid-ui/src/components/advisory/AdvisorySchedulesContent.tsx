"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { AdvisoryScheduleCreateForm } from "@/components/advisory/AdvisoryScheduleCreateForm";
import { AdvisorySchedulesBuyerChrome } from "@/components/advisory/AdvisorySchedulesBuyerChrome";
import { AdvisorySchedulesNextReviewFooterClient } from "@/components/advisory/AdvisorySchedulesNextReviewFooterClient";
import { AdvisorySchedulesPickReviewBeforeSchedulingStrip } from "@/components/advisory/AdvisorySchedulesPickReviewBeforeSchedulingStrip";
import { AdvisorySchedulesTable } from "@/components/advisory/AdvisorySchedulesTable";
import { useAdvisorySchedulesPage } from "@/components/advisory/use-advisory-schedules-page";
import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER,
  ADVISORY_SCANS_SCHEDULES_INTRO,
  ADVISORY_SCANS_SCHEDULES_LAST_LOADED_PREFIX,
  ADVISORY_SCANS_SCHEDULES_LIST_COUNT_LABEL,
  ADVISORY_SCANS_SCHEDULES_PAGE_HEADING,
  ADVISORY_SCANS_SCHEDULES_READ_ONLY,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL,
} from "@/lib/advisory-copy";

/**
 * Schedules tab: customer workflow for recurring advisory scans.
 * Mutations require AdminAuthority (API); sample / public shells are read-only.
 */
export type AdvisorySchedulesContentProps = {
  readonly initialRunId?: string | null;
};

export function AdvisorySchedulesContent(props: AdvisorySchedulesContentProps = {}): ReactElement {
  const page = useAdvisorySchedulesPage(props.initialRunId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const createScheduleButton =
    page.showHeaderCreate && !buyerPolishedShell ? (
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="advisory-schedules-create-action"
        onClick={() => page.setShowCreatePanel(true)}
      >
        Create schedule
      </Button>
    ) : null;

  const emptyStateFooter =
    page.canMutateSchedules && !page.prerequisiteBlocksSchedules && !page.showCreateForm && !buyerPolishedShell ? (
      <Button
        type="button"
        size="sm"
        variant="primary"
        data-testid="advisory-schedules-create-action"
        onClick={() => {
          page.setShowCreatePanel(true);
          document.getElementById("advisory-schedule-create-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        Create schedule
      </Button>
    ) : null;

  const listHeader = (
    <div
      className="flex flex-wrap items-start justify-between gap-2"
      data-testid="advisory-schedules-list-header"
    >
      <div className="min-w-0 space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {page.listHeading}
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Project scope:</span> {page.projectLabel}
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-schedules-count">
            {page.schedules.length} {ADVISORY_SCANS_SCHEDULES_LIST_COUNT_LABEL}
          </span>
          <span aria-hidden="true"> · </span>
          <span data-testid="advisory-schedules-last-loaded">
            {ADVISORY_SCANS_SCHEDULES_LAST_LOADED_PREFIX}: {page.lastLoadedLabel}
          </span>
        </p>
      </div>
      <RefreshButton
        busy={page.loading}
        data-testid="advisory-schedules-refresh"
        onClick={() => void page.refresh()}
      />
    </div>
  );

  return (
    <OperatorPageContainer variant="workflow" className="py-4" data-testid="advisory-schedules-content">
      <div className="min-w-0 space-y-4">
        <div className="m-0 flex flex-wrap items-start justify-between gap-2">
          <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {ADVISORY_SCANS_SCHEDULES_PAGE_HEADING}
          </h2>
          {createScheduleButton}
        </div>

        {buyerPolishedShell ? (
          <div
            className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
            data-testid="advisory-schedules-first-viewport"
          >
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="advisory-schedules-intro"
            >
              {ADVISORY_SCANS_SCHEDULES_INTRO}
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="advisory-schedules-buyer-start-here-helper"
            >
              {ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER}
            </p>
          </div>
        ) : null}

        {!buyerPolishedShell ? (
          <AdvisoryRecurrenceScheduleVocabularyRail
            currentSurfaceId="advisory-schedules"
            peerLinkLabel={ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL}
          />
        ) : null}

        {!page.scopedRunFilterActive ? (
          <AdvisorySchedulesPickReviewBeforeSchedulingStrip selectedReviewId="" onSelectReview={page.onPickReview} />
        ) : (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="advisory-schedules-run-scope-banner"
          >
            {"Scheduling advisory scans for review "}
            <span className="font-mono text-al-text-primary">{page.scopedRunId}</span>
            {" · "}
            <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={page.schedulesClearScopeHref}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              href={`/architecture/reviews/${encodeURIComponent(page.scopedRunId)}`}
            >
              Open review
            </Link>
          </p>
        )}

        {page.failure !== null ? (
          <div role="alert">
            <OperatorApiProblem
              problem={page.failure.problem}
              fallbackMessage={page.failure.message}
              correlationId={page.failure.correlationId}
            />
          </div>
        ) : null}

        {page.statusMessage !== null ? (
          <p
            className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
            role="status"
            aria-live="polite"
            data-testid="advisory-schedules-status-message"
          >
            {page.statusMessage}
          </p>
        ) : null}

        {!page.canMutateSchedules && !page.sampleModeBlocked ? (
          <p
            className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-schedules-read-only"
          >
            {ADVISORY_SCANS_SCHEDULES_READ_ONLY}
          </p>
        ) : null}

        {page.showCreateForm ? (
          <AdvisoryScheduleCreateForm
            canEdit={page.canMutateSchedules}
            sampleModeBlocked={page.sampleModeBlocked}
            creating={page.creating}
            createSuccess={page.createSuccess}
            projectLabel={page.projectLabel}
            runProjectSlug={page.runProjectSlug}
            formResetKey={page.formResetKey}
            onCreate={page.onCreate}
          />
        ) : null}

        <section className="min-w-0" data-testid="advisory-schedules-existing">
          {listHeader}
          <AdvisorySchedulesTable page={page} emptyStateFooter={emptyStateFooter} />
        </section>
        {page.scopedRunFilterActive ? <AdvisorySchedulesNextReviewFooterClient runId={page.scopedRunId} /> : null}
        <AdvisorySchedulesBuyerChrome />
      </div>
    </OperatorPageContainer>
  );
}
