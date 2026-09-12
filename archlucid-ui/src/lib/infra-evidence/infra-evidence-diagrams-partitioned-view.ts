import type { InfraEvidenceMermaidFallbackArtifactSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";
import {
  isInfraDiagramsFullMachineFallbackKey,
  isInfraDiagramsThematicPartitionKey,
  parseInfraDiagramsResourceGroupName,
} from "@/lib/infra-evidence/infra-evidence-diagrams-resource-group-view";

export const INFRA_DIAGRAMS_PARTITIONED_STATUS = "Partitioned";

export type InfraDiagramsPartitionedViewInput = {
  readonly selectedViewKey: string;
  readonly previewStatus: string;
  readonly renderStatus: string;
  readonly fallbackArtifactCount: number;
};

export type InfraDiagramsEffectiveFallbackKeyInput = {
  readonly showPartitionedViews: boolean;
  readonly selectedViewKey: string;
  readonly fallbackArtifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[];
};

export type InfraDiagramsPaintMermaidSourceInput = {
  readonly mermaidSource: string;
  readonly effectiveFallbackKey: string;
  readonly renderFallbackKey: string | null | undefined;
};

/**
 * Partitioned mode responses include oversized primary mermaid. A follow-up
 * fetch of one partition then returns that artifact's own Succeeded status.
 * If the workbench treated Succeeded as "leave partitioned mode", it would
 * drop the fallback key and refetch the full graph in a loop.
 */
export function shouldShowInfraDiagramsPartitionedViews(
  input: InfraDiagramsPartitionedViewInput,
): boolean {
  if (input.fallbackArtifactCount <= 0) {
    return false;
  }

  if (input.selectedViewKey.trim().length > 0) {
    return true;
  }

  if (input.previewStatus === INFRA_DIAGRAMS_PARTITIONED_STATUS) {
    return true;
  }

  return input.renderStatus === INFRA_DIAGRAMS_PARTITIONED_STATUS;
}

export function resolveInfraDiagramsFallbackArtifacts(
  renderArtifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[] | null | undefined,
  previewArtifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[] | null | undefined,
): readonly InfraEvidenceMermaidFallbackArtifactSummary[] {
  if (renderArtifacts != null && renderArtifacts.length > 0) {
    return renderArtifacts;
  }

  if (previewArtifacts != null && previewArtifacts.length > 0) {
    return previewArtifacts;
  }

  return [];
}

export function resolveInfraDiagramsThematicFallbackArtifacts(
  artifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[],
): readonly InfraEvidenceMermaidFallbackArtifactSummary[] {
  return artifacts.filter((artifact) => isInfraDiagramsThematicPartitionKey(artifact.key));
}

export function resolveInfraDiagramsResourceGroupFallbackArtifacts(
  artifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[],
): readonly InfraEvidenceMermaidFallbackArtifactSummary[] {
  return artifacts.filter((artifact) => parseInfraDiagramsResourceGroupName(artifact.key).length > 0);
}

export function resolveInfraDiagramsDefaultFallbackKey(
  artifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[],
): string {
  const thematic = resolveInfraDiagramsThematicFallbackArtifacts(artifacts);
  const executive = thematic.find((artifact) => artifact.key === "executive");

  if (executive != null) {
    return executive.key;
  }

  const succeeded = thematic.find((artifact) => artifact.status === "Succeeded");

  if (succeeded != null) {
    return succeeded.key;
  }

  return thematic[0]?.key ?? "";
}

export function resolveInfraDiagramsEffectiveFallbackKey(
  input: InfraDiagramsEffectiveFallbackKeyInput,
): string {
  if (!input.showPartitionedViews) {
    return "";
  }

  const selectedViewKey = input.selectedViewKey.trim();

  if (
    selectedViewKey.length > 0
    && isInfraDiagramsThematicPartitionKey(selectedViewKey)
    && !isInfraDiagramsFullMachineFallbackKey(selectedViewKey)
  ) {
    return selectedViewKey;
  }

  return resolveInfraDiagramsDefaultFallbackKey(input.fallbackArtifacts);
}

/** Skip painting Partitioned primary mermaid until the selected partition has been fetched. */
export function shouldPaintInfraDiagramsMermaidSource(
  input: InfraDiagramsPaintMermaidSourceInput,
): boolean {
  if (input.mermaidSource.trim().length === 0) {
    return false;
  }

  if (input.effectiveFallbackKey.length === 0) {
    return true;
  }

  const renderFallbackKey = (input.renderFallbackKey ?? "").trim();

  return renderFallbackKey === input.effectiveFallbackKey;
}
