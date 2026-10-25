export const INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX =
  "Declared pipeline wiring, not observed traffic.";

export const INFRA_DIAGRAMS_BUYER_CAPTION_NOT_STORED =
  "Buyer-facing data-flow caption was not stored.";

const INFRA_EVIDENCE_MERMAID_METADATA_COMMENT_PATTERN =
  /(?:^|\s)al-(?:type|rg|seed|provenance|inference|declared-id|state|outline-only)=/u;

/** True when a Mermaid comment line carries inventory node metadata rather than buyer-facing caption copy. */
export function isInfraEvidenceMermaidMetadataComment(line: string): boolean {
  return INFRA_EVIDENCE_MERMAID_METADATA_COMMENT_PATTERN.test(line);
}

export type InfraDiagramsDataFlowCaptionPresentation = {
  readonly honestyCaptions: readonly string[];
  readonly metadataComments: readonly string[];
};

export const INFRA_DIAGRAMS_DATA_FLOW_NOT_STORED_CAPTION = "Data-flow diagram was not stored.";

function parseInfraDiagramsDataFlowCaptionLinesFromMermaid(mermaidSource: string): readonly string[] {
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

export function parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaidSource: string): readonly string[] {
  return parseInfraDiagramsDataFlowCaptionLinesFromMermaid(mermaidSource).filter(
    (line) => !isInfraEvidenceMermaidMetadataComment(line),
  );
}

export function parseInfraDiagramsDataFlowCaptionPresentation(
  mermaidSource: string,
): InfraDiagramsDataFlowCaptionPresentation {
  if (mermaidSource.trim().length === 0) {
    return {
      honestyCaptions: [INFRA_DIAGRAMS_DATA_FLOW_NOT_STORED_CAPTION],
      metadataComments: [],
    };
  }

  const captions = parseInfraDiagramsDataFlowCaptionLinesFromMermaid(mermaidSource);
  const honestyCaptions = captions.filter((caption) => !isInfraEvidenceMermaidMetadataComment(caption));
  const metadataComments = captions.filter((caption) => isInfraEvidenceMermaidMetadataComment(caption));

  if (honestyCaptions.length === 0 && mermaidSource.trim().length > 0) {
    return {
      honestyCaptions: [INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX, INFRA_DIAGRAMS_BUYER_CAPTION_NOT_STORED],
      metadataComments,
    };
  }

  return {
    honestyCaptions,
    metadataComments,
  };
}

export function isInfraEvidenceDataFlowMermaid(mermaidSource: string): boolean {
  return mermaidSource.trimStart().startsWith("flowchart LR");
}
