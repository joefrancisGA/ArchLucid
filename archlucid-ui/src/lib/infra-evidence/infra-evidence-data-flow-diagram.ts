export const INFRA_DIAGRAMS_DATA_FLOW_HONESTY_PREFIX =
  "Declared pipeline wiring, not observed traffic.";

export type InfraDiagramsDataFlowCaptionPresentation = {
  readonly honestyCaptions: readonly string[];
  readonly metadataComments: readonly string[];
};

function isInfraDiagramsDataFlowMetadataComment(caption: string): boolean {
  return caption.startsWith("al-type=");
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
    .filter((line) => line.length > 0);
}

export function parseInfraDiagramsDataFlowCaptionPresentation(
  mermaidSource: string,
): InfraDiagramsDataFlowCaptionPresentation {
  const captions = parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaidSource);

  return {
    honestyCaptions: captions.filter((caption) => !isInfraDiagramsDataFlowMetadataComment(caption)),
    metadataComments: captions.filter((caption) => isInfraDiagramsDataFlowMetadataComment(caption)),
  };
}

export function isInfraEvidenceDataFlowMermaid(mermaidSource: string): boolean {
  return mermaidSource.trimStart().startsWith("flowchart LR");
}
