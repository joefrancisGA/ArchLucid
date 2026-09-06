import { isQualityRejectedRunStatus } from "@/lib/execution-vs-quality-outcome-copy";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

const TERMINAL_LEGACY_STATUSES = new Set(["Failed", "FailedPartial", "PartiallyCompleted"]);

const EXECUTE_OWNERSHIP_LEASE_EXPIRED_REASON = "ExecuteOwnershipLeaseExpired";

function isExecuteOwnershipLeaseExpiredFailure(lastFailureReason: string): boolean {
  const trimmed = lastFailureReason.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return trimmed.includes(EXECUTE_OWNERSHIP_LEASE_EXPIRED_REASON);
}

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
 * Immediate operator-facing explanation when the pipeline reached a terminal failure.
 * Unlike stall diagnosis, this does not wait on elapsed time — used under the progress tracker.
 */
export function deriveReviewPipelineTerminalFailureDiagnosis(input: {
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly summary?: RunSummary | null;
}): ReviewPipelineStallDiagnosis | null {
  const context = input.diagnosticContext;
  const isDeadLettered = context?.isDeadLettered === true;
  const legacyStatus = normalizeLegacyStatus(context?.legacyRunStatus);
  const lastFailureReason = (context?.lastFailureReason ?? "").trim();
  const completedStages = pipelineStagesComplete(input.summary ?? null);
  const isTerminal =
    isDeadLettered ||
    TERMINAL_LEGACY_STATUSES.has(legacyStatus) ||
    isQualityRejectedRunStatus(legacyStatus);

  if (!isTerminal) {
    return null;
  }

  if (isExecuteOwnershipLeaseExpiredFailure(lastFailureReason)) {
    return {
      severity: legacyStatus === "Failed" ? "error" : "warning",
      headline:
        legacyStatus === "Failed"
          ? "Assessment execution stopped — worker lost"
          : "Review partially completed — worker lost before all assessments finished",
      detail:
        "The execute worker lost its ownership lease before finishing. Reopen this review or retry execute. Persisted agent results are kept; unpersisted in-flight LLM spend may rebill on retry.",
    };
  }

  if (isDeadLettered) {
    return {
      severity: "error",
      headline: "Pipeline work dead-lettered after retries",
      detail:
        lastFailureReason.length > 0
          ? `Last failure: ${lastFailureReason}`
          : "Processing stopped after repeated failures. Re-run the review or contact your administrator if the problem continues.",
    };
  }

  if (isQualityRejectedRunStatus(legacyStatus)) {
    return {
      severity: "warning",
      headline: "Assessment completed but quality gate rejected output",
      detail:
        lastFailureReason.length > 0
          ? lastFailureReason
          : "Review did not meet the quality bar. Enrich evidence or context, then re-execute before finalizing.",
    };
  }

  if (legacyStatus === "FailedPartial") {
    return {
      severity: "error",
      headline: "Review partially completed — one or more assessments did not finish",
      detail:
        lastFailureReason.length > 0
          ? lastFailureReason
          : "Re-run the review before finalizing.",
    };
  }

  if (legacyStatus === "PartiallyCompleted") {
    return {
      severity: "warning",
      headline: "Assessment coverage is incomplete",
      detail:
        lastFailureReason.length > 0
          ? lastFailureReason
          : "Re-run the review before finalizing.",
    };
  }

  if (legacyStatus === "Failed" && completedStages === 0) {
    return {
      severity: "error",
      headline: "Execution failed before the first pipeline stage",
      detail:
        lastFailureReason.length > 0
          ? lastFailureReason
          : "The review stopped before processing began. This is usually a configuration or infrastructure issue — not missing intake fields. Check AI configuration, then re-run the review.",
    };
  }

  return {
    severity: "error",
    headline: "Assessment execution failed",
    detail:
      lastFailureReason.length > 0
        ? lastFailureReason
        : "Check configuration and re-run the review when ready.",
  };
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
          : "Processing stopped after repeated failures. Re-run the review or contact your administrator if the problem continues.",
    };
  }

  if (completedStages === 0 && !timelineStarted && input.elapsedMinutes >= 15) {
    if (legacyStatus === "Failed") {
      return {
        severity: "error",
        headline: "Execution failed before the first pipeline stage",
        detail:
          lastFailureReason.length > 0
            ? `The review stopped before processing began. ${lastFailureReason}`
            : "The review stopped before processing began. This is usually a configuration or infrastructure issue — not missing intake fields. Check AI configuration, then re-run the review.",
      };
    }

    return {
      severity: "warning",
      headline: "No pipeline stage has started yet",
      detail:
        "This usually means deferred AuthorityPipelineWork is queued but the background worker is not processing, " +
        "or execute never advanced past run creation. Confirm the API host runs AuthorityPipelineWorkHostedService " +
        "(Combined role, not Api-only) and check dbo.AuthorityPipelineWorkOutbox for the review id.",
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
