/** Buyer-visible labels for model-governance catalog agent roles. */
export function modelGovernanceAgentTypeLabel(agentType: string): string {
  const trimmed = agentType.trim();

  if (trimmed.length === 0) {
    return "Unknown agent role";
  }

  switch (trimmed) {
    case "Topology":
      return "Topology";
    case "Cost":
      return "Cost";
    case "Compliance":
      return "Compliance";
    case "Critic":
      return "Critic";
    default: {
      const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
  }
}
