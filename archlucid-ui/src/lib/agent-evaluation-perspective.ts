import type {
  AgentOutputEvaluationPerspectivePayload,
  AgentOutputEvaluationSummaryPayload,
} from "@/types/agent-forensics";

/** Authoritative evaluate-time perspective when persisted (TB-973). */
export function authoritativeAgentEvaluationPerspective(
  summary: AgentOutputEvaluationSummaryPayload | null | undefined,
): AgentOutputEvaluationPerspectivePayload | null {
  if (!summary) return null;

  return summary.recorded ?? summary.advisoryCurrent ?? null;
}

/** Live host-floor diagnostic perspective (TB-973). */
export function diagnosticAgentEvaluationPerspective(
  summary: AgentOutputEvaluationSummaryPayload | null | undefined,
): AgentOutputEvaluationPerspectivePayload | null {
  if (!summary) return null;

  return summary.advisoryCurrent ?? summary.recorded ?? null;
}
