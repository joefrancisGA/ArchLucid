import { plainLanguageFailureCauseSentence } from "@/lib/execution-vs-quality-outcome-copy";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import type { RunDetail } from "@/types/authority";
import type { RunSummary } from "@/types/authority";

export type RunDetailLastFailureSummary = {
  readonly agentType?: string | null;
  readonly agentTypeKey?: string | null;
  readonly failureClass?: string | null;
  readonly reasonCode?: string | null;
  readonly triageScenarioId?: string | null;
  readonly rejectReasonCategory?: string | null;
};

/** Buyer-safe one-line cause from recorded last-agent failure metadata. */
export function formatReviewLastFailureCauseLine(
  summary: RunDetailLastFailureSummary | null | undefined,
): string | null {
  if (summary === null || summary === undefined) {
    return null;
  }

  return plainLanguageFailureCauseSentence({
    failureClass: summary.failureClass,
    triageScenarioId: summary.triageScenarioId,
    reasonCode: summary.reasonCode,
  });
}

export function resolveReviewFailureRecordedAtUtc(input: {
  readonly pipelineSummary?: RunSummary | null;
  readonly runCompletedUtc?: string | null;
}): string | null {
  const completedUtc = (input.runCompletedUtc ?? input.pipelineSummary?.completedUtc ?? "").trim();

  return completedUtc.length > 0 ? completedUtc : null;
}

export function formatReviewFailureRecordedAtLabel(recordedAtUtc: string | null | undefined): string | null {
  const normalized = (recordedAtUtc ?? "").trim();

  if (normalized.length === 0) {
    return null;
  }

  const formatted = formatIsoUtcForDisplay(normalized);

  if (formatted === normalized && Number.isNaN(Date.parse(normalized))) {
    return null;
  }

  return formatted;
}

/** Reads optional last-agent-failure projection without importing the card UI module (TB-933 / TB-965). */
export function resolveRunDetailLastFailureSummary(
  detail: RunDetail,
): RunDetailLastFailureSummary | null {
  const summary = (detail as { lastAgentExecutionFailure?: RunDetailLastFailureSummary | null })
    .lastAgentExecutionFailure;

  if (summary !== null && summary !== undefined) {
    return summary;
  }

  return null;
}
