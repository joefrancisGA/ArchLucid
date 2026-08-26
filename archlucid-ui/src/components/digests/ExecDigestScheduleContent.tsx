"use client";

import Link from "next/link";
import { type ReactElement } from "react";

import { OperatorLivePreviewPinLayout } from "@/components/advisory/OperatorLivePreviewPinLayout";
import { DigestsHubNextReviewFooterClient } from "@/components/digests/DigestsHubNextReviewFooterClient";
import { ExecDigestPickReviewBeforeSchedulingStrip } from "@/components/digests/ExecDigestPickReviewBeforeSchedulingStrip";
import { ExecDigestScheduleForm } from "@/components/digests/ExecDigestScheduleForm";
import { ExecDigestSchedulePreviewPanel } from "@/components/digests/ExecDigestSchedulePreviewPanel";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DIGESTS_SCHEDULE_TAB_RESPONSIBILITY, EXEC_DIGEST_PRODUCT_INTRO, EXEC_DIGEST_READ_ONLY, EXEC_DIGEST_SAMPLE_BLOCKED } from "@/lib/exec-digest-schedule-page-model";
import { digestsHubScopedHref } from "@/lib/digests-route-paths";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  useExecDigestSchedule,
  type ExecDigestScheduleContentProps,
} from "./use-exec-digest-schedule";

export type { ExecDigestScheduleContentProps };

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

/** Schedule tab: sponsor digest delivery settings (direct recipients + weekly cadence). */
export function ExecDigestScheduleContent(props: ExecDigestScheduleContentProps = {}): ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const schedule = useExecDigestSchedule(props);

  const scopedRunId = (props.scopedRunId ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const requiresReviewPick = props.onPickReview !== undefined;
  const scheduleUiVisible = scopedRunFilterActive || !requiresReviewPick;
  const scheduleClearScopeHref = digestsHubScopedHref("schedule", null);

  return (
    <div className="w-full space-y-4" data-testid="exec-digest-schedule-content">
      <div>
        <h2
          className={cn("m-0 font-bold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
          data-testid="exec-digest-schedule-heading"
        >
          Schedule sponsor digest
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {EXEC_DIGEST_PRODUCT_INTRO}
        </p>
        {buyerPolishedShell ? null : (
          <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {DIGESTS_SCHEDULE_TAB_RESPONSIBILITY}
          </p>
        )}
      </div>

      {!scopedRunFilterActive && requiresReviewPick ? (
        <ExecDigestPickReviewBeforeSchedulingStrip
          selectedReviewId=""
          onSelectReview={props.onPickReview!}
        />
      ) : scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="exec-digest-run-scope-banner"
        >
          {"Scheduling sponsor digest for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={scheduleClearScopeHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {scheduleUiVisible ? (
      <>
      {schedule.sampleModeBlocked ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="exec-digest-sample-blocked"
        >
          {EXEC_DIGEST_SAMPLE_BLOCKED}{" "}
          <Link className="text-al-link underline-offset-2 hover:underline" href="/get-started">
            Start an evaluation
          </Link>
          .
        </p>
      ) : null}

      {!schedule.canMutate && !schedule.sampleModeBlocked ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="exec-digest-read-only"
        >
          {EXEC_DIGEST_READ_ONLY}
        </p>
      ) : null}

      {schedule.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={schedule.failure.problem}
            fallbackMessage={schedule.failure.message}
            correlationId={schedule.failure.correlationId}
          />
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {schedule.statusMessage}
      </div>

      {schedule.loading || schedule.form === null || schedule.prefs === null ? (
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
          Loading schedule…
        </p>
      ) : (
        <OperatorLivePreviewPinLayout
          pinRail={schedule.pinLivePreviewRail}
          testId="exec-digest-schedule-layout"
          primary={
            <ExecDigestScheduleForm
              sampleModeBlocked={schedule.sampleModeBlocked}
              canMutate={schedule.canMutate}
              form={schedule.form}
              prefs={schedule.prefs}
              recipientDraft={schedule.recipientDraft}
              recipientDraftError={schedule.recipientDraftError}
              recipientsTouched={schedule.recipientsTouched}
              recipientEmails={schedule.recipientEmails}
              recipientValidation={schedule.recipientValidation}
              onRecipientDraftChange={schedule.onRecipientDraftChange}
              onRecipientDraftBlur={schedule.onRecipientDraftBlur}
              addRecipientFromDraft={schedule.addRecipientFromDraft}
              removeRecipient={schedule.removeRecipient}
              ianaTimeZoneOptions={schedule.ianaTimeZoneOptions}
              unsavedChanges={schedule.unsavedChanges}
              formValid={schedule.formValid}
              status={schedule.status}
              savedSummary={schedule.savedSummary}
              readiness={schedule.readiness}
              recipientCount={schedule.recipientCount}
              enableDeliveryRecipientRequiredHintId={schedule.enableDeliveryRecipientRequiredHintId}
              enableDeliveryRecipientRequiredReason={schedule.enableDeliveryRecipientRequiredReason}
              subscriptionDestinationCount={schedule.subscriptionDestinationCount}
              hasPreviewDigest={schedule.hasPreviewDigest}
              previewHref={schedule.previewHref}
              busy={schedule.busy}
              liveScheduleSummary={schedule.liveScheduleSummary}
              pinLivePreviewRail={schedule.pinLivePreviewRail}
              saving={schedule.saving}
              enabling={schedule.enabling}
              pausing={schedule.pausing}
              saveSuccess={schedule.saveSuccess}
              healthSnap={schedule.healthSnap}
              onRefresh={schedule.onRefresh}
              refreshing={schedule.refreshing}
              updateForm={schedule.updateForm}
              onSaveSchedule={schedule.onSaveSchedule}
              onEnableDelivery={schedule.onEnableDelivery}
              onPauseDelivery={schedule.onPauseDelivery}
              selectClassName={SELECT_CLASS}
            />
          }
          aside={
            <>
            {schedule.pinLivePreviewRail ? (
              <ExecDigestSchedulePreviewPanel
                variant="delivery-readiness"
                sampleModeBlocked={schedule.sampleModeBlocked}
                form={schedule.form}
                prefs={schedule.prefs}
                status={schedule.status}
                readiness={schedule.readiness}
                savedSummary={schedule.savedSummary}
                recipientCount={schedule.recipientCount}
                subscriptionDestinationCount={schedule.subscriptionDestinationCount}
                liveScheduleSummary={schedule.liveScheduleSummary}
                pinLivePreviewRail={schedule.pinLivePreviewRail}
                hasPreviewDigest={schedule.hasPreviewDigest}
                previewHref={schedule.previewHref}
                healthSnap={schedule.healthSnap}
                onRefresh={schedule.onRefresh}
                refreshing={schedule.refreshing}
              />
            ) : null}

            {schedule.pinLivePreviewRail ? (
              <ExecDigestSchedulePreviewPanel
                variant="saved-summary"
                sampleModeBlocked={schedule.sampleModeBlocked}
                form={schedule.form}
                prefs={schedule.prefs}
                status={schedule.status}
                readiness={schedule.readiness}
                savedSummary={schedule.savedSummary}
                recipientCount={schedule.recipientCount}
                subscriptionDestinationCount={schedule.subscriptionDestinationCount}
                liveScheduleSummary={schedule.liveScheduleSummary}
                pinLivePreviewRail={schedule.pinLivePreviewRail}
                hasPreviewDigest={schedule.hasPreviewDigest}
                previewHref={schedule.previewHref}
                healthSnap={schedule.healthSnap}
                onRefresh={schedule.onRefresh}
                refreshing={schedule.refreshing}
              />
            ) : null}

            <ExecDigestSchedulePreviewPanel
              variant="latest-generated"
              sampleModeBlocked={schedule.sampleModeBlocked}
              form={schedule.form}
              prefs={schedule.prefs}
              status={schedule.status}
              readiness={schedule.readiness}
              savedSummary={schedule.savedSummary}
              recipientCount={schedule.recipientCount}
              subscriptionDestinationCount={schedule.subscriptionDestinationCount}
              liveScheduleSummary={schedule.liveScheduleSummary}
              pinLivePreviewRail={schedule.pinLivePreviewRail}
              hasPreviewDigest={schedule.hasPreviewDigest}
              previewHref={schedule.previewHref}
              healthSnap={schedule.healthSnap}
              onRefresh={schedule.onRefresh}
              refreshing={schedule.refreshing}
            />
            </>
          }
        />
      )}
      </>
      ) : null}

      {scopedRunFilterActive ? (
        <DigestsHubNextReviewFooterClient
          runId={scopedRunId}
          tab="schedule"
          title="Next review digest schedule"
          actionLabel="Schedule next digest"
          ariaLabel="Next review digest schedule"
          testIdPrefix="exec-digest-schedule"
        />
      ) : null}
    </div>
  );
}
