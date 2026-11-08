import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";

const DEGRADED_EXECUTION_WITHOUT_AGENT_DETAIL =
  "Degraded execution was recorded without agent detail.";

export function degradedExecutionAgentsTooltip(agents: readonly string[] | undefined): string {
  const labels = (agents ?? [])
    .filter((agent) => agent.trim().length > 0)
    .map((agent) => buyerLabelForAgentType(agent));

  if (labels.length === 0) {
    return DEGRADED_EXECUTION_WITHOUT_AGENT_DETAIL;
  }

  return `Resource-level LLM fallback on: ${labels.join(", ")}`;
}
