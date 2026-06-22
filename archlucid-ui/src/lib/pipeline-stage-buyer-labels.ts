const PIPELINE_STAGE_BUYER_LABELS: Readonly<Record<string, string>> = {
  context_ingestion: "Reading your evidence",
  graph: "Mapping the architecture",
  findings: "Analyzing security and cost",
  decisioning: "Checking policy compliance",
  artifacts: "Finalizing signed package",
  topology_analysis: "Mapping the architecture",
  cost_analysis: "Estimating cost impact",
  compliance_analysis: "Checking policy compliance",
  finding_synthesis: "Finding risks",
  critic_review: "Adversarial second pass",
  artifact_generation: "Writing recommendations",
  manifest_finalization: "Finalizing signed package",
};

function fallbackStageName(stageName: string): string {
  return stageName.replaceAll("_", " ");
}

/** Maps authority pipeline stage names to buyer-facing labels when the polished shell is active. */
export function buyerPipelineStageName(stageName: string, buyerPolished: boolean): string {
  const trimmed = stageName.trim();

  if (!buyerPolished || trimmed.length === 0) {
    return fallbackStageName(trimmed);
  }

  const label = PIPELINE_STAGE_BUYER_LABELS[trimmed];

  if (label !== undefined) {
    return label;
  }

  return fallbackStageName(trimmed);
}
