import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import {
  plainLanguageFailureClassLabel,
  plainLanguageTriageTitle,
} from "@/lib/execution-vs-quality-outcome-copy";
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

function resolveAgentLabel(summary: RunDetailLastFailureSummary): string {
  const rawAgentType =
    (typeof summary.agentType === "string" && summary.agentType.length > 0
      ? summary.agentType
      : null) ??
    (typeof summary.agentTypeKey === "string" && summary.agentTypeKey.length > 0
      ? summary.agentTypeKey
      : null);

  return rawAgentType !== null ? buyerLabelForAgentType(rawAgentType) : "Unknown agent";
}

/** Buyer-safe one-line cause from recorded last-agent failure metadata. */
export function formatReviewLastFailureCauseLine(
  summary: RunDetailLastFailureSummary | null | undefined,
): string | null {
  if (summary === null || summary === undefined) {
    return null;
  }

  const parts: string[] = [resolveAgentLabel(summary)];

  const triageTitle = plainLanguageTriageTitle(summary.triageScenarioId);

  if (triageTitle !== null) {
    parts.push(triageTitle);
  } else {
    const failureClassLabel = plainLanguageFailureClassLabel(summary.failureClass);

    if (failureClassLabel.length > 0 && failureClassLabel !== "Unknown") {
      parts.push(failureClassLabel);
    }
  }

  const reasonCode = (summary.reasonCode ?? "").trim();

  if (reasonCode.length > 0) {
    parts.push(`reason code ${reasonCode}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
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

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString();
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
