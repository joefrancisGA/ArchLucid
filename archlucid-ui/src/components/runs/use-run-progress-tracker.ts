"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  canPromptForDesktopNotifications,
  useReviewCompletionNotification,
} from "@/hooks/use-review-completion-notification";
import { useRunStageTimelineQuery } from "@/hooks/use-run-stage-timeline-query";
import { useReviewPipelineInFlightForRun } from "@/hooks/use-review-pipeline-in-flight-for-run";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";
import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
} from "@/lib/browser-desktop-notification";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolvePipelineJobLabel } from "@/lib/architecture/architecture-package-origin";
import {
  REVIEW_PIPELINE_ASSESSMENT_WATCHDOG_MESSAGE,
  resolveReviewPipelineBackgroundSafetyMessage,
  resolveReviewPipelinePollMaxMs,
  resolveReviewPipelineTimeoutMessage,
  shouldShowReviewPipelineBackgroundSafety,
} from "@/lib/review-execution-background-safety-copy";
import { isReviewPipelineDebugEnabled } from "@/lib/review-pipeline-debug-policy";
import {
  deriveReviewPipelineTerminalFailureDiagnosis,
  type ReviewPipelineDiagnosticContext,
} from "@/lib/review-pipeline-stall-diagnosis";
import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { resolveCurrentPipelineStageLabel } from "@/lib/resolve-active-pipeline-stage";
import { formatWorkspaceReviewDurationBand } from "@/lib/workspace-review-duration-estimate";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

import {
  allStagesReady,
  analysisStagesComplete,
  resolvePreFinalizeTerminal,
  stageDone,
} from "./run-progress-stage-helpers";

export type UseRunProgressTrackerOptions = {
  readonly runId: string;
  readonly initialSummary: RunSummary | null;
  readonly preFinalizeReadyToFinalize?: boolean;
  readonly buyerAssessmentCopy?: boolean;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly deferFailureRecoveryToDoThisNext?: boolean;
};

export function useRunProgressTracker({
  runId,
  initialSummary,
  preFinalizeReadyToFinalize,
  buyerAssessmentCopy = false,
  diagnosticContext = null,
  deferFailureRecoveryToDoThisNext = false,
}: UseRunProgressTrackerOptions) {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const pipelineDebugEnabled = isReviewPipelineDebugEnabled();
  const [preFinalizeTerminal, setPreFinalizeTerminal] = useState(() =>
    resolvePreFinalizeTerminal(initialSummary, preFinalizeReadyToFinalize),
  );
  const pipelineTerminalFailure = isReviewPipelineTerminalFailure(diagnosticContext);
  const inFlightOperation = useReviewPipelineInFlightForRun(runId);
  const rerunning =
    inFlightOperation !== null && !isTerminalOperationState(inFlightOperation.state);
  const pollEnabled =
    (!allStagesReady(initialSummary) && !preFinalizeTerminal && !pipelineTerminalFailure) || rerunning;

  const [pollSession, setPollSession] = useState(0);
  const [clientPhase, setClientPhase] = useState<"polling" | "complete" | "timeout">(() =>
    preFinalizeTerminal || allStagesReady(initialSummary) ? "complete" : "polling",
  );
  const timelineEnabled =
    buyerAssessmentCopy || pollEnabled || preFinalizeTerminal || pipelineTerminalFailure;
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

  const currentStageLabel = useMemo(
    () => resolveCurrentPipelineStageLabel(stageTimeline, activeSummary, buyerPolished),
    [activeSummary, buyerPolished, stageTimeline],
  );

  const pipelineJobLabel = useMemo(
    () => resolvePipelineJobLabel(activeSummary, buyerAssessmentCopy),
    [activeSummary, buyerAssessmentCopy],
  );

  const terminalFailureDiagnosis = useMemo(
    () =>
      pipelineTerminalFailure
        ? deriveReviewPipelineTerminalFailureDiagnosis({
            diagnosticContext,
            summary: activeSummary,
          })
        : null,
    [activeSummary, diagnosticContext, pipelineTerminalFailure],
  );

  const liveStatus = useMemo(() => {
    if (preFinalizeTerminal) {
      return "Ready to finalize — use Finalize review to create the finalized review record for this architecture review.";
    }

    if (pipelineTerminalFailure) {
      return deferFailureRecoveryToDoThisNext
        ? "Assessment did not finish — see Do this next above for what happened and how to recover."
        : "Assessment did not finish — recovery steps are shown in Do this next above.";
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
    pipelineTerminalFailure,
    preFinalizeTerminal,
    deferFailureRecoveryToDoThisNext,
    runId,
    sseConnected,
  ]);

  const showNotificationOptIn =
    pollEnabled && canPromptForDesktopNotifications() && notificationPermission === "default";
  const showNotificationEnabled = pollEnabled && notificationPermission === "granted";

  const resumeWatching = useCallback(() => {
    setClientPhase("polling");
    setPollSession((s) => s + 1);
  }, []);

  const shouldRender =
    pollEnabled || preFinalizeTerminal || buyerAssessmentCopy || pipelineTerminalFailure;

  return {
    runId,
    initialSummary,
    diagnosticContext,
    buyerPolished,
    buyerAssessmentCopy,
    pipelineDebugEnabled,
    pollEnabled,
    preFinalizeTerminal,
    pipelineTerminalFailure,
    clientPhase,
    stageTimeline,
    summary,
    streamPhase,
    sseConnected,
    pollSession,
    pollMaxMs,
    pollCount,
    lastPollAtIso,
    lastPollError,
    lastSummaryChangeAtIso,
    backgroundSafetyMessage,
    durationBandMessage,
    activeSummary,
    ctx,
    graph,
    findings,
    manifest,
    completedStages,
    totalProgressStages,
    progressValue,
    currentStageLabel,
    pipelineJobLabel,
    terminalFailureDiagnosis,
    liveStatus,
    showNotificationOptIn,
    showNotificationEnabled,
    handleEnableNotifications,
    resumeWatching,
    shouldRender,
  };
}

export type RunProgressTrackerViewModel = ReturnType<typeof useRunProgressTracker>;

export type { StageTimelineSummary };
