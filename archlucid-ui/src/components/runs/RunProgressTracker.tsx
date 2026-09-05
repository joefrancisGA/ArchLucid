"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ReviewPipelineStopAnalysisButton } from "@/components/runs/ReviewPipelineStopAnalysisButton";
import {
  REVIEW_PIPELINE_DURATION_ESTIMATE_DISCLAIMER,
  REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL,
  REVIEW_PIPELINE_KEEP_WATCHING_CTA,
  REVIEW_PIPELINE_NOTIFICATIONS_ENABLED_LABEL,
} from "@/lib/review-execution-background-safety-copy";
import { LongOperationQueueStatusLine } from "@/components/operations/LongOperationQueueStatusLine";
import {
  LONG_OPERATION_QUEUE_STATUS_REFRESH_HINT,
} from "@/lib/operations/long-operation-wait-copy";
import { ReRunReviewButton } from "@/components/runs/ReRunReviewButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { renderDoThisNextReferenceCopy } from "@/lib/usability/do-this-next-reference-copy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

import { ReviewPipelineDevTelemetryPanel } from "./ReviewPipelineDevTelemetryPanel";
import {
  OperatorErrorCallout,
  OperatorWarningCallout,
} from "@/components/operator/OperatorShellMessage";
import { RunProgressTrackerStagesView } from "./RunProgressTrackerStagesView";
import { useRunProgressTracker } from "./use-run-progress-tracker";

export type RunProgressTrackerProps = {
  runId: string;
  initialSummary: RunSummary | null;
  /** Create-home Activity: analysis stages finished, Finalized review record not created yet. */
  readonly preFinalizeReadyToFinalize?: boolean;
  /** Buyer-facing assessment copy instead of pipeline transport jargon. */
  readonly buyerAssessmentCopy?: boolean;
  /** Optional run-detail fields for dev telemetry and stall diagnosis. */
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  /** When Do this next already owns recovery guidance, avoid repeating the failure callout here. */
  readonly deferFailureRecoveryToDoThisNext?: boolean;
};

export function RunProgressTracker({
  runId,
  initialSummary,
  preFinalizeReadyToFinalize,
  buyerAssessmentCopy = false,
  diagnosticContext = null,
  deferFailureRecoveryToDoThisNext = false,
}: RunProgressTrackerProps) {
  const tracker = useRunProgressTracker({
    runId,
    initialSummary,
    preFinalizeReadyToFinalize,
    buyerAssessmentCopy,
    diagnosticContext,
    deferFailureRecoveryToDoThisNext,
  });

  if (!tracker.shouldRender) {
    return null;
  }

  const progressHeading = tracker.pipelineJobLabel.heading;

  return (
    <section
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="run-progress-tracker-title"
      data-testid="run-progress-tracker"
    >
      <h3 id="run-progress-tracker-title" className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {progressHeading}
      </h3>
      {tracker.buyerPolished || tracker.buyerAssessmentCopy ? null : (
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <strong>Review ID:</strong>{" "}
          <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{runId}</code>
        </p>
      )}

      {tracker.pollEnabled && !tracker.buyerAssessmentCopy && tracker.backgroundSafetyMessage ? (
        <p
          className={cn("mt-3 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-progress-background-safety"
        >
          {tracker.backgroundSafetyMessage}
        </p>
      ) : null}

      {tracker.pollEnabled && tracker.durationBandMessage ? (
        <p
          className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-progress-duration-estimate"
        >
          {tracker.durationBandMessage}{" "}
          <span className="text-neutral-500 dark:text-neutral-400">{REVIEW_PIPELINE_DURATION_ESTIMATE_DISCLAIMER}</span>
        </p>
      ) : null}

      {tracker.pollEnabled && tracker.clientPhase === "polling" ? (
        <div className="mt-3" data-testid="run-progress-queue-status">
          <LongOperationQueueStatusLine stageLabel={tracker.currentStageLabel} />
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {LONG_OPERATION_QUEUE_STATUS_REFRESH_HINT}
          </p>
        </div>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className={cn("mt-3 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {renderDoThisNextReferenceCopy(tracker.liveStatus)}
      </div>

      {tracker.terminalFailureDiagnosis !== null && !deferFailureRecoveryToDoThisNext ? (
        tracker.terminalFailureDiagnosis.severity === "warning" ? (
          <OperatorWarningCallout>
            <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{tracker.terminalFailureDiagnosis.headline}</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{tracker.terminalFailureDiagnosis.detail}</p>
          </OperatorWarningCallout>
        ) : (
          <OperatorErrorCallout>
            <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>{tracker.terminalFailureDiagnosis.headline}</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{tracker.terminalFailureDiagnosis.detail}</p>
          </OperatorErrorCallout>
        )
      ) : null}

      {tracker.pipelineTerminalFailure ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="run-progress-terminal-failure-actions">
          <ReRunReviewButton
            runId={runId}
            retryCount={diagnosticContext?.retryCount ?? initialSummary?.retryCount ?? null}
            data-testid="run-progress-re-run-review"
          />
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Re-invokes agent execution for this review with the same intake.
          </p>
        </div>
      ) : null}

      {tracker.showNotificationOptIn ? (
        <div className="mt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => void tracker.handleEnableNotifications()}>
            {REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL}
          </Button>
        </div>
      ) : null}

      {tracker.showNotificationEnabled ? (
        <p
          className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-progress-notifications-enabled"
        >
          {REVIEW_PIPELINE_NOTIFICATIONS_ENABLED_LABEL}
        </p>
      ) : null}

      {tracker.pollEnabled && tracker.clientPhase === "polling" ? (
        <ReviewPipelineStopAnalysisButton runId={runId} className="mt-3" />
      ) : null}

      {tracker.pollEnabled && tracker.clientPhase === "timeout" ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={tracker.resumeWatching}
          >
            {REVIEW_PIPELINE_KEEP_WATCHING_CTA}
          </Button>
        </div>
      ) : null}

      <RunProgressTrackerStagesView
        buyerAssessmentCopy={tracker.buyerAssessmentCopy}
        pipelineJobLabel={tracker.pipelineJobLabel}
        completedStages={tracker.completedStages}
        totalProgressStages={tracker.totalProgressStages}
        ctx={tracker.ctx}
        graph={tracker.graph}
        findings={tracker.findings}
        manifest={tracker.manifest}
        stageTimeline={tracker.stageTimeline}
        activeSummary={tracker.activeSummary}
      />

      {tracker.pipelineDebugEnabled ? (
        <ReviewPipelineDevTelemetryPanel
          snapshot={{
            runId,
            summary: tracker.summary,
            initialSummary,
            diagnosticContext,
            stageTimeline: tracker.stageTimeline,
            streamPhase: tracker.streamPhase,
            sseConnected: tracker.sseConnected,
            clientPhase: tracker.clientPhase,
            pollSession: tracker.pollSession,
            pollMaxMs: tracker.pollMaxMs,
            pollCount: tracker.pollCount,
            lastPollAtIso: tracker.lastPollAtIso,
            lastPollError: tracker.lastPollError,
            lastSummaryChangeAtIso: tracker.lastSummaryChangeAtIso,
          }}
        />
      ) : null}
    </section>
  );
}
