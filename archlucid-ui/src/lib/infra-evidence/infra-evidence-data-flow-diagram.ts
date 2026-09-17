export const INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX =
  "Declared pipeline wiring, not observed traffic.";

export function parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaidSource: string): readonly string[] {
  if (mermaidSource.trim().length === 0) {
    return [];
  }

  return mermaidSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("%% "))
    .map((line) => line.slice(3).trim())
    .filter((line) => line.length > 0);
}

export function isInfraEvidenceDataFlowMermaid(mermaidSource: string): boolean {
  return mermaidSource.trimStart().startsWith("flowchart LR");
}
