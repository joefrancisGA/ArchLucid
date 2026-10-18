import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import type {
  InfraEvidenceMermaidOutline,
  InfraEvidenceMermaidOutlineEdge,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type InfraEvidenceDiagramLegendInferredCopy = {
  readonly legendLine: string;
  readonly footnote: string;
};

function isHostnameInferredEdge(edge: InfraEvidenceMermaidOutlineEdge): boolean {
  const inference = edge.inferenceSource?.trim().toLowerCase() ?? "";

  if (inference.includes("hostname")) {
    return true;
  }

  const provenance = edge.provenanceKind?.trim().toLowerCase() ?? "";

  return edge.source === "inferred" && provenance === "deterministicinference";
}

function isAiInferredEdge(edge: InfraEvidenceMermaidOutlineEdge): boolean {
  const provenance = edge.provenanceKind?.trim().toLowerCase() ?? "";

  return provenance === "aiinference";
}

function resolveInferredKinds(
  outline: InfraEvidenceMermaidOutline | null | undefined,
  mermaidSource?: string | null,
): { readonly hasHostname: boolean; readonly hasAi: boolean } {
  let hasHostname = false;
  let hasAi = false;

  for (const edge of outline?.edges ?? []) {
    if (edge.source !== "inferred") {
      continue;
    }

    if (isHostnameInferredEdge(edge)) {
      hasHostname = true;
    }

    if (isAiInferredEdge(edge)) {
      hasAi = true;
    }
  }

  const mermaid = mermaidSource?.trim() ?? "";

  if (!hasAi && /al-provenance=AiInference/iu.test(mermaid)) {
    hasAi = true;
  }

  if (!hasHostname && /hostname/iu.test(mermaid) && /inferred|likely/iu.test(mermaid)) {
    hasHostname = true;
  }

  return { hasHostname, hasAi };
}

export function resolveInfraEvidenceDiagramLegendInferredCopy(
  outline: InfraEvidenceMermaidOutline | null | undefined,
  mermaidSource?: string | null,
): InfraEvidenceDiagramLegendInferredCopy {
  const { hasHostname, hasAi } = resolveInferredKinds(outline, mermaidSource);

  if (hasHostname && hasAi) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI_FOOTNOTE,
    };
  }

  if (hasAi) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI_FOOTNOTE,
    };
  }

  return {
    legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN,
    footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_FOOTNOTE,
  };
}
