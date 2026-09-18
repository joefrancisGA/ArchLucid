export const INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX =
  "Declared pipeline wiring, not observed traffic.";

const INFRA_EVIDENCE_MERMAID_METADATA_COMMENT_PATTERN = /(?:^|\s)al-(?:type|rg|seed)=/u;

/** True when a Mermaid comment line carries inventory node metadata rather than buyer-facing caption copy. */
export function isInfraEvidenceMermaidMetadataComment(line: string): boolean {
  return INFRA_EVIDENCE_MERMAID_METADATA_COMMENT_PATTERN.test(line);
}

export function parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaidSource: string): readonly string[] {
  if (mermaidSource.trim().length === 0) {
    return [];
  }

  return mermaidSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("%% "))
    .map((line) => line.slice(3).trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isInfraEvidenceMermaidMetadataComment(line));
}

export function isInfraEvidenceDataFlowMermaid(mermaidSource: string): boolean {
  return mermaidSource.trimStart().startsWith("flowchart LR");
}
