import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

export type ReviewPipelineDiagnosticContext = {
  readonly legacyRunStatus?: string | null;
  readonly isDeadLettered?: boolean | null;
  readonly lastFailureReason?: string | null;
  readonly otelTraceId?: string | null;
  readonly retryCount?: number | null;
};

export type ReviewPipelineStallDiagnosis = {
  readonly headline: string;
  readonly detail: string;
  readonly severity: "info" | "warning" | "error";
};

function pipelineStagesComplete(summary: RunSummary | null): number {
  if (summary === null) {
    return 0;
  }

  return [
    summary.hasContextSnapshot === true,
    summary.hasGraphSnapshot === true,
    summary.hasFindingsSnapshot === true,
    summary.hasGoldenManifest === true,
  ].filter(Boolean).length;
}

function normalizeLegacyStatus(status: string | null | undefined): string {
  return (status ?? "").trim();
}

/**
 * Operator-facing explanation when a review has been in progress far longer than expected.
 * Used by the stalled callout and the dev telemetry panel.
 */
export function deriveReviewPipelineStallDiagnosis(input: {
  readonly summary: RunSummary | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly stageTimeline?: readonly StageTimelineSummary[];
  readonly elapsedMinutes: number;
  readonly transport?: "live stream" | "polling" | "idle";
  readonly clientPhase?: "polling" | "complete" | "timeout";
}): ReviewPipelineStallDiagnosis | null {
  const completedStages = pipelineStagesComplete(input.summary);
  const legacyStatus = normalizeLegacyStatus(input.diagnosticContext?.legacyRunStatus);
  const isDeadLettered = input.diagnosticContext?.isDeadLettered === true;
  const lastFailureReason = (input.diagnosticContext?.lastFailureReason ?? "").trim();
  const timelineStarted = (input.stageTimeline ?? []).some((row) => (row.startedUtc ?? "").trim().length > 0);

  if (isDeadLettered) {
    return {
      severity: "error",
      headline: "Pipeline work dead-lettered after retries",
      detail:
        lastFailureReason.length > 0
          ? `Server marked this review as dead-lettered. Last failure: ${lastFailureReason}`
          : "Server marked this review as dead-lettered. Check API logs and AuthorityPipelineWork outbox for this review.",
    };
  }

  if (completedStages === 0 && !timelineStarted && input.elapsedMinutes >= 15) {
    if (legacyStatus === "Failed") {
      return {
        severity: "error",
        headline: "Execution failed before the first pipeline stage",
        detail:
          lastFailureReason.length > 0
            ? `Run status is Failed with no stage snapshots. ${lastFailureReason}`
            : "Run status is Failed with no stage snapshots. Re-execute or inspect API logs for this review id.",
      };
    }

    return {
      severity: "warning",
      headline: "No pipeline stage has started yet",
      detail:
        "This usually means deferred AuthorityPipelineWork is queued but the background worker is not processing, " +
        "or execute never advanced past run creation. Confirm the API host runs AuthorityPipelineWorkHostedService " +
        "(Combined role, not Api-only) and check dbo.AuthorityPipelineWorkOutbox for this review id.",
    };
  }

  if (input.clientPhase === "timeout" && completedStages < 4) {
    return {
      severity: "info",
      headline: "Browser stopped refreshing — server may still be running",
      detail:
        "The progress tracker hit its client watchdog. Open Activity and use Keep watching, or inspect server stage " +
        "timeline and traces. Nothing was canceled on the server.",
    };
  }

  if (input.transport === "polling" && completedStages === 0 && input.elapsedMinutes >= 30) {
    return {
      severity: "info",
      headline: "Live SSE unavailable — polling only",
      detail:
        "Summary updates are arriving via HTTP polling because the events stream is not connected. Progress can look " +
        "stale even when the server is healthy; verify GET /v1/authority/reviews/{id}/events through the UI proxy.",
    };
  }

  if (completedStages > 0 && completedStages < 4 && input.elapsedMinutes >= 45) {
    return {
      severity: "warning",
      headline: "Pipeline started but is progressing slowly",
      detail:
        `Only ${completedStages} of 4 stages are complete after ${input.elapsedMinutes}+ minutes. Large evidence bundles, ` +
        "cold-start infrastructure, or tenant concurrency gates can extend stage time.",
    };
  }

  return null;
}
