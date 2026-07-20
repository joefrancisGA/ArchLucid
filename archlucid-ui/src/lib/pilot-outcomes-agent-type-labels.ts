/** Maps internal agent identifiers to sponsor-readable analysis coverage labels. */
const AGENT_TYPE_SPONSOR_LABELS: Record<string, string> = {
  ArchitectureReviewer: "Architecture review",
  SecurityReviewer: "Security analysis",
  CostReviewer: "Cost analysis",
  ComplianceReviewer: "Compliance analysis",
  GovernanceReviewer: "Governance analysis",
};

export function formatPilotOutcomesAgentTypeLabel(agentType: string): string {
  const trimmed = agentType.trim();

  if (trimmed.length === 0) {
    return "Unknown analysis";
  }

  const mapped = AGENT_TYPE_SPONSOR_LABELS[trimmed];

  if (mapped !== undefined) {
    return mapped;
  }

  const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatPilotOutcomesAnalysisCoverage(agentTypes: readonly string[]): string {
  if (agentTypes.length === 0) {
    return "Not available";
  }

  return agentTypes.map(formatPilotOutcomesAgentTypeLabel).join(", ");
}
