import type { RunDetail } from "@/types/authority";

export type RunDetailLastFailureSummary = {
  readonly agentType?: string | null;
  readonly agentTypeKey?: string | null;
  readonly failureClass?: string | null;
  readonly reasonCode?: string | null;
  readonly triageScenarioId?: string | null;
  readonly rejectReasonCategory?: string | null;
};

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
