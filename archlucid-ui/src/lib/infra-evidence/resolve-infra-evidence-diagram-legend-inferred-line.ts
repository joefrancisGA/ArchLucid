import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_AND_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_HOSTNAME_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN_FOOTNOTE,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNNAMED_KIND,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import type {
  InfraEvidenceMermaidOutline,
  InfraEvidenceMermaidOutlineEdge,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type InfraEvidenceDiagramLegendInferredCopy = {
  readonly legendLine: string;
  readonly footnote: string;
};

const APP_SETTINGS_INFERENCE_SOURCES = new Set([
  "inventory-hostname-inferred-target",
  "inventory-storage-host-ref",
]);

const LINKED_SERVICE_TEXT_GUESS_INFERENCE_SOURCES = new Set([
  "inventory-adf-linked-service-inferred",
  "inventory-synapse-linked-service-inferred",
]);

function normalizedInferenceSource(edge: InfraEvidenceMermaidOutlineEdge): string {
  return edge.inferenceSource?.trim().toLowerCase() ?? "";
}

function isAppSettingsInferredEdge(edge: InfraEvidenceMermaidOutlineEdge): boolean {
  return APP_SETTINGS_INFERENCE_SOURCES.has(normalizedInferenceSource(edge));
}

function isLinkedServiceTextGuessEdge(edge: InfraEvidenceMermaidOutlineEdge): boolean {
  return LINKED_SERVICE_TEXT_GUESS_INFERENCE_SOURCES.has(normalizedInferenceSource(edge));
}

function isAiInferredEdge(edge: InfraEvidenceMermaidOutlineEdge): boolean {
  const provenance = edge.provenanceKind?.trim().toLowerCase() ?? "";

  return provenance === "aiinference";
}

function resolveInferredKinds(
  outline: InfraEvidenceMermaidOutline | null | undefined,
  mermaidSource?: string | null,
): {
  readonly hasAppSettings: boolean;
  readonly hasLinkedServiceGuess: boolean;
  readonly hasAi: boolean;
} {
  let hasAppSettings = false;
  let hasLinkedServiceGuess = false;
  let hasAi = false;

  for (const edge of outline?.edges ?? []) {
    if (edge.source !== "inferred") {
      continue;
    }

    if (isAppSettingsInferredEdge(edge)) {
      hasAppSettings = true;
    }

    if (isLinkedServiceTextGuessEdge(edge)) {
      hasLinkedServiceGuess = true;
    }

    if (isAiInferredEdge(edge)) {
      hasAi = true;
    }
  }

  const mermaid = mermaidSource?.trim() ?? "";

  if (!hasAi && /al-provenance=AiInference/iu.test(mermaid)) {
    hasAi = true;
  }

  if (!hasLinkedServiceGuess && /linked-service-inferred/iu.test(mermaid)) {
    hasLinkedServiceGuess = true;
  }

  return { hasAppSettings, hasLinkedServiceGuess, hasAi };
}

function resolveInferredSourceLegendFallback(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): InfraEvidenceDiagramLegendInferredCopy {
  const inferredEdges = (outline?.edges ?? []).filter((edge) => edge.source === "inferred");
  let hasStoredUnnamedSource = false;
  let allSourcesMissing = inferredEdges.length > 0;

  for (const edge of inferredEdges) {
    const source = normalizedInferenceSource(edge);

    if (source.length === 0) {
      continue;
    }

    allSourcesMissing = false;

    if (
      !isAppSettingsInferredEdge(edge)
      && !isLinkedServiceTextGuessEdge(edge)
      && !isAiInferredEdge(edge)
    ) {
      hasStoredUnnamedSource = true;
    }
  }

  if (hasStoredUnnamedSource) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNNAMED_KIND,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN_FOOTNOTE,
    };
  }

  return {
    legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN,
    footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN_FOOTNOTE,
  };
}

export function resolveInfraEvidenceDiagramLegendInferredCopy(
  outline: InfraEvidenceMermaidOutline | null | undefined,
  mermaidSource?: string | null,
): InfraEvidenceDiagramLegendInferredCopy {
  const { hasAppSettings, hasLinkedServiceGuess, hasAi } = resolveInferredKinds(outline, mermaidSource);

  if (hasAppSettings && hasAi) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_AND_AI_FOOTNOTE,
    };
  }

  if (hasAppSettings) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_APP_SETTINGS_FOOTNOTE,
    };
  }

  if (hasLinkedServiceGuess && hasAi) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_AND_AI_FOOTNOTE,
    };
  }

  if (hasAi) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_AI_FOOTNOTE,
    };
  }

  if (hasLinkedServiceGuess) {
    return {
      legendLine: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE,
      footnote: INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_LINKED_SERVICE_FOOTNOTE,
    };
  }

  return resolveInferredSourceLegendFallback(outline);
}

