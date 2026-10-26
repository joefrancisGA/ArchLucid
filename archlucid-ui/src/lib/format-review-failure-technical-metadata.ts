import type { RunDetailLastFailureSummary } from "@/components/resolve-run-detail-last-failure-summary";
import { formatReviewFailureRecordedAtLabel } from "@/components/resolve-run-detail-last-failure-summary";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import {
  plainLanguageFailureClassLabel,
  plainLanguageRejectCategoryLabel,
  plainLanguageTriageTitle,
  resolveExecutionVsQualityAxis,
} from "@/lib/execution-vs-quality-outcome-copy";
import type { ReviewPipelineDiagnosticContext } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

export type ReviewFailureTechnicalMetadataRow = {
  readonly label: string;
  readonly value: string;
  readonly monospace?: boolean;
};

export type ReviewFailureTechnicalMetadataInput = {
  readonly runId: string;
  readonly lastFailureSummary?: RunDetailLastFailureSummary | null;
  readonly diagnosticContext?: ReviewPipelineDiagnosticContext | null;
  readonly pipelineSummary?: RunSummary | null;
  readonly failureRecordedAtUtc?: string | null;
  readonly retryCount?: number | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function formatPipelineStageFlag(
  label: string,
  value: boolean | null | undefined,
  notStoredLabel: string,
): string {
  if (value === null || value === undefined) {
    return `${label}=${notStoredLabel}`;
  }

  return `${label}=${value === true ? "yes" : "no"}`;
}

function formatAssessmentProgressValue(summary: RunSummary | null | undefined): string {
  if (summary === null || summary === undefined) {
    return "Assessment progress was not stored.";
  }

  const flags = [
    summary.hasContextSnapshot,
    summary.hasGraphSnapshot,
    summary.hasFindingsSnapshot,
    summary.hasGoldenManifest,
  ];

  if (flags.some((flag) => flag === null || flag === undefined)) {
    return "Assessment step completion was not stored.";
  }

  const completed = flags.filter((flag) => flag === true).length;

  return `${completed} / 4 assessment steps`;
}

function formatPipelineStageFlags(summary: RunSummary | null | undefined): string {
  if (summary === null || summary === undefined) {
    return "Assessment progress was not stored.";
  }

  return [
    formatPipelineStageFlag("context", summary.hasContextSnapshot, "Context snapshot status was not stored."),
    formatPipelineStageFlag("graph", summary.hasGraphSnapshot, "Graph snapshot status was not stored."),
    formatPipelineStageFlag("findings", summary.hasFindingsSnapshot, "Findings snapshot status was not stored."),
    formatPipelineStageFlag("manifest", summary.hasGoldenManifest, "Package snapshot status was not stored."),
  ].join(", ");
}

function resolveLikelyCauseSentence(input: {
  readonly failureClass: string;
  readonly reasonCode: string;
  readonly completedStages: number | null;
}): string | null {
  if (input.reasonCode === "NoScheduledAgentTasks") {
    return "Execute ran before any agent tasks were scheduled — typical deferred authority-pipeline timing miss. Re-run should resume the queued pipeline on current builds.";
  }

  if (input.reasonCode === "MissingArchitectureRequest") {
    return "Re-run could not load the architecture request needed to resume the deferred pipeline — data repair or support may be required.";
  }

  if (input.reasonCode === "ExecuteOwnershipLeaseExpired") {
    return "Execute worker lost its ownership lease before finishing — reopen or retry execute; retry skips persisted agents but may rebill unpersisted LLM spend.";
  }

  if (input.failureClass === "invalidOperation") {
    if (input.completedStages === null) {
      return "Completed stage count was not stored.";
    }

    if (input.completedStages === 0) {
      return "Pre-stage invalid operation — processing stopped before pipeline stage 1. Often the same deferred-pipeline scheduling miss when reasonCode is absent on older failure records.";
    }
  }

  if (input.failureClass === "pipelineDeadLetter") {
    return "Pipeline work dead-lettered after repeated failures — inspect worker health and outbox depth.";
  }

  return null;
}

/** Buyer-visible likely-cause sentence promoted into the What failed line. */
export function resolveReviewFailureLikelyCause(input: {
  readonly failureClass?: string | null;
  readonly reasonCode?: string | null;
  readonly completedStages?: number | null;
}): string | null {
  const failureClass = normalize(input.failureClass);
  const reasonCode = normalize(input.reasonCode);
  const completedStages =
    input.completedStages === null || input.completedStages === undefined ? null : input.completedStages;

  if (failureClass.length === 0 && reasonCode.length === 0) {
    return null;
  }

  return resolveLikelyCauseSentence({
    failureClass,
    reasonCode,
    completedStages,
  });
}

function resolveAgentLabel(summary: RunDetailLastFailureSummary | null | undefined): string | null {
  if (summary === null || summary === undefined) {
    return null;
  }

  const rawAgentType: string | null =
    normalize(summary.agentType).length > 0
      ? (summary.agentType ?? null)
      : normalize(summary.agentTypeKey).length > 0
        ? (summary.agentTypeKey ?? null)
        : null;

  if (rawAgentType === null) {
    return null;
  }

  const label = buyerLabelForAgentType(rawAgentType);

  return label === "Unknown agent" ? rawAgentType : label;
}

function pushRow(
  rows: ReviewFailureTechnicalMetadataRow[],
  label: string,
  value: string | null | undefined,
  monospace = false,
): void {
  const normalized = normalize(value);

  if (normalized.length === 0) {
    return;
  }

  rows.push({ label, value: normalized, monospace });
}

/** Operator-facing failure metadata for technically sophisticated users (Do this next). */
export function formatReviewFailureTechnicalMetadataRows(
  input: ReviewFailureTechnicalMetadataInput,
): readonly ReviewFailureTechnicalMetadataRow[] {
  const summary = input.lastFailureSummary ?? null;
  const diagnosticContext = input.diagnosticContext ?? null;
  const pipelineSummary = input.pipelineSummary ?? null;
  const failureClass = normalize(summary?.failureClass);
  const reasonCode = normalize(summary?.reasonCode);
  const legacyRunStatus = normalize(diagnosticContext?.legacyRunStatus);
  const completedStages =
    pipelineSummary === null || pipelineSummary === undefined
      ? null
      : [
          pipelineSummary.hasContextSnapshot === true,
          pipelineSummary.hasGraphSnapshot === true,
          pipelineSummary.hasFindingsSnapshot === true,
          pipelineSummary.hasGoldenManifest === true,
        ].filter(Boolean).length;
  const axis = resolveExecutionVsQualityAxis({
    failureClass: summary?.failureClass,
    legacyRunStatus: diagnosticContext?.legacyRunStatus,
  });
  const rows: ReviewFailureTechnicalMetadataRow[] = [];

  pushRow(rows, "Review id", input.runId, true);
  pushRow(
    rows,
    "Failure recorded",
    formatReviewFailureRecordedAtLabel(input.failureRecordedAtUtc ?? null) ?? undefined,
  );
  pushRow(rows, "Review outcome", legacyRunStatus, true);
  pushRow(rows, "Failure axis", axis, true);
  pushRow(rows, "Assessment progress", formatAssessmentProgressValue(pipelineSummary));
  pushRow(rows, "Assessment step flags", formatPipelineStageFlags(pipelineSummary), true);
  pushRow(rows, "Failure class", failureClass, true);
  pushRow(rows, "Failure class (label)", plainLanguageFailureClassLabel(summary?.failureClass));
  pushRow(rows, "Reason code", reasonCode, true);
  pushRow(rows, "Agent", resolveAgentLabel(summary) ?? undefined);
  pushRow(rows, "Agent type key", summary?.agentTypeKey ?? undefined, true);
  pushRow(rows, "Agent type (wire)", summary?.agentType ?? undefined, true);
  pushRow(rows, "Triage scenario id", summary?.triageScenarioId ?? undefined, true);
  pushRow(rows, "Triage title", plainLanguageTriageTitle(summary?.triageScenarioId) ?? undefined);
  pushRow(
    rows,
    "Reject category",
    plainLanguageRejectCategoryLabel(summary?.rejectReasonCategory) ?? undefined,
  );

  const retryCount = input.retryCount ?? diagnosticContext?.retryCount ?? pipelineSummary?.retryCount;

  if (retryCount !== null && retryCount !== undefined) {
    rows.push({ label: "Retry count", value: String(retryCount) });
  }

  if (diagnosticContext?.isDeadLettered === true) {
    rows.push({ label: "Dead lettered", value: "yes", monospace: true });
  }

  pushRow(rows, "OpenTelemetry trace id", diagnosticContext?.otelTraceId ?? undefined, true);
  pushRow(rows, "Last failure reason (stored)", diagnosticContext?.lastFailureReason ?? undefined, true);

  const likelyCause = resolveLikelyCauseSentence({
    failureClass,
    reasonCode,
    completedStages,
  });

  pushRow(rows, "Likely cause", likelyCause ?? undefined);

  return rows;
}

export function hasReviewFailureTechnicalMetadata(
  input: ReviewFailureTechnicalMetadataInput,
): boolean {
  return formatReviewFailureTechnicalMetadataRows(input).length > 0;
}
