"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ReviewPipelineStopAnalysisButton } from "@/components/runs/ReviewPipelineStopAnalysisButton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  canPromptForDesktopNotifications,
  useReviewCompletionNotification,
} from "@/hooks/use-review-completion-notification";
import { useRunStageTimelineQuery } from "@/hooks/use-run-stage-timeline-query";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";
import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
} from "@/lib/browser-desktop-notification";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatStageDurationMs } from "@/lib/format-stage-duration";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";
import { resolvePipelineJobLabel } from "@/lib/architecture/architecture-package-origin";
import {
  REVIEW_PIPELINE_ASSESSMENT_WATCHDOG_MESSAGE,
  REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE,
  REVIEW_PIPELINE_DURATION_ESTIMATE_DISCLAIMER,
  REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL,
  REVIEW_PIPELINE_KEEP_WATCHING_CTA,
  REVIEW_PIPELINE_NOTIFICATIONS_ENABLED_LABEL,
  resolveReviewPipelineBackgroundSafetyMessage,
  resolveReviewPipelinePollMaxMs,
  resolveReviewPipelineTimeoutMessage,
  shouldShowReviewPipelineBackgroundSafety,
} from "@/lib/review-execution-background-safety-copy";
import { isReviewPipelineDebugEnabled } from "@/lib/review-pipeline-debug-policy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import { resolveCurrentPipelineStageLabel } from "@/lib/resolve-active-pipeline-stage";
import { formatWorkspaceReviewDurationBand } from "@/lib/workspace-review-duration-estimate";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import { ReviewPipelineDevTelemetryPanel } from "./ReviewPipelineDevTelemetryPanel";

export type RunProgressTrackerProps = {
  runId: string;
  initialSummary: RunSummary | null;
  /** Create-home Activity: analysis stages finished, Finalized review record not created yet. */
  readonly preFinalizeReadyToFinalize?: boolean;
  /** Buyer-facing assessment copy instead of pipeline transport jargon. */
  readonly buyerAssessmentCopy?: boolean;
  /** Optional run-detail fields for dev telemetry and stall diagnosis. */
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
};

function stageDone(flag: boolean | undefined): boolean {
  return flag === true;
}

function analysisStagesComplete(s: RunSummary | null): boolean {
  if (s === null) {
    return false;
  }

  return (
    stageDone(s.hasContextSnapshot) &&
    stageDone(s.hasGraphSnapshot) &&
    stageDone(s.hasFindingsSnapshot)
  );
}

function allStagesReady(s: RunSummary | null): boolean {
  if (s === null) {
    return false;
  }

  return analysisStagesComplete(s) && stageDone(s.hasGoldenManifest);
}

function resolvePreFinalizeTerminal(
  initialSummary: RunSummary | null,
  preFinalizeReadyToFinalize: boolean | undefined,
): boolean {
  if (preFinalizeReadyToFinalize === true) {
    return true;
  }

  if (preFinalizeReadyToFinalize === false) {
    return false;
  }

  return analysisStagesComplete(initialSummary) && !stageDone(initialSummary?.hasGoldenManifest);
}

export function RunProgressTracker({
  runId,
  initialSummary,
  preFinalizeReadyToFinalize,
  buyerAssessmentCopy = false,
  diagnosticContext = null,
}: RunProgressTrackerProps) {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const pipelineDebugEnabled = isReviewPipelineDebugEnabled();
  const [preFinalizeTerminal, setPreFinalizeTerminal] = useState(() =>
    resolvePreFinalizeTerminal(initialSummary, preFinalizeReadyToFinalize),
  );
  const pollEnabled = !allStagesReady(initialSummary) && !preFinalizeTerminal;

  const [pollSession, setPollSession] = useState(0);
  const [clientPhase, setClientPhase] = useState<"polling" | "complete" | "timeout">(() =>
    preFinalizeTerminal || allStagesReady(initialSummary) ? "complete" : "polling",
  );
  const timelineEnabled = buyerAssessmentCopy || pollEnabled || preFinalizeTerminal;
  const stageTimelineQuery = useRunStageTimelineQuery(runId, {
    enabled: timelineEnabled,
    pollSession,
    refetchInterval:
      pollEnabled && clientPhase === "polling" ? 5_000 : false,
  });
  const stageTimeline = stageTimelineQuery.data ?? [];
  const [notificationPermission, setNotificationPermission] = useState(() => getDesktopNotificationPermission());
  const [pollCount, setPollCount] = useState(0);
  const [lastPollAtIso, setLastPollAtIso] = useState<string | null>(null);
  const [lastPollError, setLastPollError] = useState<string | null>(null);
  const [lastSummaryChangeAtIso, setLastSummaryChangeAtIso] = useState<string | null>(null);

  const { estimate: durationEstimate, loading: durationLoading } = useWorkspaceReviewDurationEstimate(
    pollEnabled && clientPhase === "polling",
  );
  const pollMaxMs = useMemo(
    () => resolveReviewPipelinePollMaxMs(durationEstimate?.p90Seconds),
    [durationEstimate?.p90Seconds],
  );

  const { summary, streamPhase, sseConnected } = useRunSummaryStream(runId, {
    enabled: pollEnabled && clientPhase === "polling",
    initialSummary,
    retryToken: pollSession,
  });

  useEffect(() => {
    if (summary === null) {
      return;
    }

    setLastSummaryChangeAtIso(new Date().toISOString());
  }, [summary]);

  const backgroundSafetyMessage = useMemo(() => {
    if (!shouldShowReviewPipelineBackgroundSafety(summary?.structuralExecutionMode)) {
      return null;
    }

    return resolveReviewPipelineBackgroundSafetyMessage(summary?.structuralExecutionMode);
  }, [summary?.structuralExecutionMode]);

  const durationBandMessage = useMemo(() => {
    if (durationEstimate === null) {
      return null;
    }

    return formatWorkspaceReviewDurationBand(durationEstimate);
  }, [durationEstimate]);

  useReviewCompletionNotification({
    runId,
    enabled: pollEnabled,
    isComplete: clientPhase === "complete",
    reviewLabel: summary?.displayName ?? summary?.description ?? null,
  });

  useEffect(() => {
    if (!pollEnabled || clientPhase !== "polling" || durationLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setClientPhase("timeout");
    }, pollMaxMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [durationLoading, pollEnabled, clientPhase, pollSession, pollMaxMs]);

  useEffect(() => {
    // Create-home Activity: when live summary reaches analysis-complete without a signed
    // review record, stop polling and show Ready to finalize (do not wait on initialSummary only).
    if (
      buyerAssessmentCopy &&
      analysisStagesComplete(summary) &&
      !stageDone(summary?.hasGoldenManifest)
    ) {
      setPreFinalizeTerminal(true);
      setClientPhase("complete");

      return;
    }

    if (allStagesReady(summary) || streamPhase === "complete") {
      setClientPhase("complete");
    }
  }, [buyerAssessmentCopy, summary, streamPhase]);

  useEffect(() => {
    if (!timelineEnabled) {
      return;
    }

    if (stageTimelineQuery.isFetched) {
      setPollCount((count) => count + 1);
      setLastPollAtIso(new Date().toISOString());
      setLastPollError(
        stageTimelineQuery.isError
          ? stageTimelineQuery.error instanceof Error
            ? stageTimelineQuery.error.message
            : "Stage timeline fetch failed"
          : null,
      );
    }
  }, [
    stageTimelineQuery.dataUpdatedAt,
    stageTimelineQuery.error,
    stageTimelineQuery.isError,
    stageTimelineQuery.isFetched,
    timelineEnabled,
  ]);

  useEffect(() => {
    if (!timelineEnabled || summary === null) {
      return;
    }

    void stageTimelineQuery.refetch();
  }, [summary, stageTimelineQuery, timelineEnabled]);

  const handleEnableNotifications = useCallback(async () => {
    const next = await requestDesktopNotificationPermission();
    setNotificationPermission(next);
  }, []);

  const activeSummary = summary ?? initialSummary;
  const ctx = stageDone(activeSummary?.hasContextSnapshot);
  const graph = stageDone(activeSummary?.hasGraphSnapshot);
  const findings = stageDone(activeSummary?.hasFindingsSnapshot);
  const manifest = stageDone(activeSummary?.hasGoldenManifest);

  const assessmentStageCount = 3;
  const completedAssessmentStages = [ctx, graph, findings].filter(Boolean).length;
  const completedPipelineStages = [ctx, graph, findings, manifest].filter(Boolean).length;
  const completedStages = buyerAssessmentCopy ? completedAssessmentStages : completedPipelineStages;
  const totalProgressStages = buyerAssessmentCopy ? assessmentStageCount : 4;
  const progressValue = (completedStages / totalProgressStages) * 100;

  const pipelineJobLabel = useMemo(
    () => resolvePipelineJobLabel(activeSummary, buyerAssessmentCopy),
    [activeSummary, buyerAssessmentCopy],
  );

  const currentStageLabel = useMemo(
    () => resolveCurrentPipelineStageLabel(stageTimeline, activeSummary, buyerPolished),
    [activeSummary, buyerPolished, stageTimeline],
  );

  const liveStatus = useMemo(() => {
    if (preFinalizeTerminal) {
      return "Ready to finalize — use Finalize review to create the finalized review record for this architecture review.";
    }

    if (buyerAssessmentCopy) {
      if (clientPhase === "complete") {
        return `${completedAssessmentStages} of ${assessmentStageCount} assessment stages complete.`;
      }

      if (clientPhase === "timeout") {
        return REVIEW_PIPELINE_ASSESSMENT_WATCHDOG_MESSAGE;
      }

      return `${completedAssessmentStages} of ${assessmentStageCount} assessment stages complete.`;
    }

    if (clientPhase === "complete") {
      return "Pipeline complete — refresh for full detail.";
    }

    if (clientPhase === "timeout") {
      return resolveReviewPipelineTimeoutMessage({
        buyerPolished,
        runId,
        p90Seconds: durationEstimate?.p90Seconds,
      });
    }

    const transport = sseConnected ? "live stream" : "polling";

    return `${completedPipelineStages} of 4 ${pipelineJobLabel.stageSummaryNoun} stages complete (${transport}).`;
  }, [
    buyerAssessmentCopy,
    pipelineJobLabel.stageSummaryNoun,
    clientPhase,
    completedAssessmentStages,
    completedPipelineStages,
    buyerPolished,
    durationEstimate?.p90Seconds,
    preFinalizeTerminal,
    runId,
    sseConnected,
  ]);

  if (!pollEnabled && !preFinalizeTerminal && !buyerAssessmentCopy) {
    return null;
  }

  const showNotificationOptIn =
    pollEnabled && canPromptForDesktopNotifications() && notificationPermission === "default";
  const showNotificationEnabled = pollEnabled && notificationPermission === "granted";
  const progressHeading = pipelineJobLabel.heading;

  return (
    <section
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="run-progress-tracker-title"
      data-testid="run-progress-tracker"
    >
      <h3 id="run-progress-tracker-title" className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {progressHeading}
      </h3>
      {buyerPolished || buyerAssessmentCopy ? null : (
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <strong>Review ID:</strong>{" "}
          <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>{runId}</code>
        </p>
      )}

      {pollEnabled && !buyerAssessmentCopy && backgroundSafetyMessage ? (
        <p
          className={cn("mt-3 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-progress-background-safety"
        >
          {backgroundSafetyMessage}
        </p>
      ) : null}

      {pollEnabled && durationBandMessage ? (
        <p
          className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-progress-duration-estimate"
        >
          {durationBandMessage}{" "}
          <span className="text-neutral-500 dark:text-neutral-400">{REVIEW_PIPELINE_DURATION_ESTIMATE_DISCLAIMER}</span>
        </p>
      ) : null}

      {pollEnabled && clientPhase === "polling" ? (
        <p
          className={cn("mt-3 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-progress-current-stage"
        >
          Currently: {currentStageLabel}
        </p>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className={cn("mt-3 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {liveStatus}
      </div>

      {showNotificationOptIn ? (
        <div className="mt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => void handleEnableNotifications()}>
            {REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL}
          </Button>
        </div>
      ) : null}

      {showNotificationEnabled ? (
        <p
          className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-progress-notifications-enabled"
        >
          {REVIEW_PIPELINE_NOTIFICATIONS_ENABLED_LABEL}
        </p>
      ) : null}

      {pollEnabled && clientPhase === "polling" ? (
        <ReviewPipelineStopAnalysisButton runId={runId} className="mt-3" />
      ) : null}

      {pollEnabled && clientPhase === "timeout" ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setClientPhase("polling");
              setPollSession((s) => s + 1);
            }}
          >
            {REVIEW_PIPELINE_KEEP_WATCHING_CTA}
          </Button>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <div className={cn("flex justify-between text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
          <span>{progressHeading}</span>
          <span>
            {completedStages} / {totalProgressStages} stages
          </span>
        </div>
        <Progress
          value={progressValue}
          className="h-2"
          aria-label={pipelineJobLabel.progressAriaLabel}
        />
      </div>

      <Separator className="my-6" />

      <ul className="m-0 flex flex-col gap-3 p-0 list-none">
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>Source context captured</span>
          <StatusTag kind={ctx ? "ready" : "draft"} label={ctx ? "Complete" : "Pending"} />
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>Evidence graph ready</span>
          <StatusTag kind={graph ? "ready" : "draft"} label={graph ? "Complete" : "Pending"} />
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>Findings complete</span>
          <StatusTag kind={findings ? "ready" : "draft"} label={findings ? "Complete" : "Pending"} />
        </li>
        {buyerAssessmentCopy ? (
          <li className="flex flex-wrap items-center gap-2" data-testid="run-progress-signed-record-row">
            <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>Finalized review record</span>
            <StatusTag
              kind={manifest ? "ready" : "draft"}
              label={manifest ? "Complete" : "Not created yet"}
            />
          </li>
        ) : (
          <li className="flex flex-wrap items-center gap-2">
            <span className={cn("w-36 font-medium", OPERATOR_TYPOGRAPHY.body)}>Finalized review record ready</span>
            <StatusTag kind={manifest ? "ready" : "draft"} label={manifest ? "Complete" : "Pending"} />
          </li>
        )}
      </ul>

      {buyerAssessmentCopy && stageTimeline.length > 0 ? (
        <div className="mt-6" data-testid="run-progress-stage-timeline-table">
          <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Stage timing</h4>
          <EnterpriseTable ariaLabel="Assessment stage timing" className="mt-3">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Started</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Completed</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Duration</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {stageTimeline.map((stage) => (
                <EnterpriseTableRow key={stage.stageName}>
                  <EnterpriseTableCell>{buyerPipelineStageName(stage.stageName, true)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatInstantForLocale(stage.startedUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatInstantForLocale(stage.completedUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatStageDurationMs(stage.durationMs ?? null)}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      ) : null}

      {activeSummary?.description ? (
        <p className={cn("mt-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{activeSummary.description}</p>
      ) : null}

      {pipelineDebugEnabled ? (
        <ReviewPipelineDevTelemetryPanel
          snapshot={{
            runId,
            summary,
            initialSummary,
            diagnosticContext,
            stageTimeline,
            streamPhase,
            sseConnected,
            clientPhase,
            pollSession,
            pollMaxMs,
            pollCount,
            lastPollAtIso,
            lastPollError,
            lastSummaryChangeAtIso,
          }}
        />
      ) : null}
    </section>
  );
}
