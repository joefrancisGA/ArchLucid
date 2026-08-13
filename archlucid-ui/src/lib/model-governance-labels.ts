import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import {
  ARCHITECTURE_STRUCTURE_BUYER_LABEL,
} from "@/lib/usability/canonical-product-terms";

/** Buyer-visible labels for model-governance catalog agent roles. */
export function modelGovernanceAgentTypeLabel(agentType: string): string {
  const trimmed = agentType.trim();

  if (trimmed.length === 0) {
    return "Unknown agent role";
  }

  switch (trimmed) {
    case "Topology":
      return ARCHITECTURE_STRUCTURE_BUYER_LABEL;
    case "Cost":
    case "Compliance":
    case "Critic":
      return buyerLabelForAgentType(trimmed);
    default: {
      const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
  }
}

/** Buyer-visible labels for governed alias capability tags. */
export function modelGovernanceCapabilityTagLabel(tag: string): string {
  const trimmed = tag.trim();

  if (trimmed.length === 0) {
    return "Unknown capability";
  }

  switch (trimmed) {
    case "structured-output":
      return "Structured output";
    default: {
      const spaced = trimmed.replace(/-/g, " ");

      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
  }
}
