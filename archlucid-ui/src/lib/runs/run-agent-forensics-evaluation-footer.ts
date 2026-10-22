import type { AgentOutputEvaluationPerspectivePayload } from "@/types/agent-forensics";

/** Footer copy for scored vs skipped traces (UU-444, UU-452). */
export function formatRunAgentForensicsEvaluationFooter(input: {
  readonly evaluatedAtLabel: string;
  readonly perspective: AgentOutputEvaluationPerspectivePayload;
}): string {
  const scoredCount = input.perspective.scores.length;
  const skipped = input.perspective.tracesSkippedCount;
  const parts: string[] = [
    `Evaluated at ${input.evaluatedAtLabel}`,
    `Scored ${scoredCount} trace${scoredCount === 1 ? "" : "s"}`,
    `Skipped ${skipped} (not evaluated on this pass)`,
    "Averages below are over scored traces only",
  ];

  if (
    input.perspective.averageStructuralCompletenessRatio !== null
    && input.perspective.averageStructuralCompletenessRatio !== undefined
  ) {
    parts.push(`avg structural: ${input.perspective.averageStructuralCompletenessRatio.toFixed(2)}`);
  }

  if (
    input.perspective.averageSemanticScore !== null
    && input.perspective.averageSemanticScore !== undefined
  ) {
    parts.push(`avg semantic: ${input.perspective.averageSemanticScore.toFixed(2)}`);
  }

  return parts.join(" · ");
}
