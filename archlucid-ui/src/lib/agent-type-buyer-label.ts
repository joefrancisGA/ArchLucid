import {
  ARCHITECTURE_STRUCTURE_BUYER_LABEL,
} from "@/lib/usability/canonical-product-terms";

/**
 * Maps wire AgentType values to buyer-facing labels.
 * OpenAPI emits string AgentType; accept legacy numeric wire values during UI/API rollout.
 */
export function buyerLabelForAgentType(agentType: string | number | null | undefined): string {
  if (agentType === null || agentType === undefined) {
    return "Agent (unknown)";
  }

  if (typeof agentType === "string") {
    const trimmed = agentType.trim();

    if (trimmed.length === 0) {
      return "Agent (unknown)";
    }

    switch (trimmed) {
      case "Topology":
        return ARCHITECTURE_STRUCTURE_BUYER_LABEL;
      case "Cost":
        return "Cost";
      case "Compliance":
        return "Compliance";
      case "Critic":
        return "Critic";
      default:
        return `Agent (${trimmed})`;
    }
  }

  switch (agentType) {
    case 1:
      return ARCHITECTURE_STRUCTURE_BUYER_LABEL;
    case 2:
      return "Cost";
    case 3:
      return "Compliance";
    case 4:
      return "Critic";
    default:
      return `AgentType(${String(agentType)})`;
  }
}
