import {
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_PNG_CONFIGURATION_RELATIONSHIP_NOTE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { resolveInfraEvidenceDiagramLegendInferredCopy } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-inferred-line";
import { resolveInfraEvidenceDiagramLegendProbableLine } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-probable-line";
import {
  hasInfraEvidenceDeclaredDiagramEdges,
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceProbableDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceCompletenessWarningPresentation } from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";

export const INFRA_EVIDENCE_PNG_SNAPSHOT_LABEL_NOT_STORED = "Snapshot label was not stored." as const;
export const INFRA_EVIDENCE_PNG_RESOURCE_GROUP_SCOPE_NOT_STORED =
  "Resource group scope was not stored." as const;
export const INFRA_EVIDENCE_PNG_DEPENDENCY_NEIGHBORHOOD_SCOPE_NOT_STORED =
  "Dependency neighborhood starting resource was not stored." as const;

export type InfraEvidencePngReadingStripInput = {
  readonly mode: string | null | undefined;
  readonly outline: InfraEvidenceMermaidOutline | null | undefined;
  readonly completenessWarnings: readonly string[];
  readonly snapshotLabel?: string | null;
  readonly resourceGroupScopeName?: string | null;
  readonly dependencyNeighborhoodSeedLabel?: string | null;
};

function pngSnapshotLabelLine(snapshotLabel: string | null | undefined): string {
  const trimmed = snapshotLabel?.trim() ?? "";

  if (trimmed.length === 0) {
    return INFRA_EVIDENCE_PNG_SNAPSHOT_LABEL_NOT_STORED;
  }

  return `Snapshot: ${trimmed}`;
}

function pngResourceGroupScopeLine(resourceGroupScopeName: string | null | undefined): string | null {
  if (resourceGroupScopeName === null || resourceGroupScopeName === undefined) {
    return null;
  }

  const trimmed = resourceGroupScopeName.trim();

  if (trimmed.length === 0) {
    return INFRA_EVIDENCE_PNG_RESOURCE_GROUP_SCOPE_NOT_STORED;
  }

  return `Scope: resource group ${trimmed}.`;
}

function pngDependencyNeighborhoodScopeLine(seedLabel: string | null | undefined): string | null {
  if (seedLabel === null || seedLabel === undefined) {
    return null;
  }

  const trimmed = seedLabel.trim();

  if (trimmed.length === 0) {
    return INFRA_EVIDENCE_PNG_DEPENDENCY_NEIGHBORHOOD_SCOPE_NOT_STORED;
  }

  return `Scope: dependency neighborhood from ${trimmed}.`;
}

function hasObservedEdges(outline: InfraEvidenceMermaidOutline | null | undefined): boolean {
  return outline?.edges.some((edge) => edge.source === "observed") === true;
}

const CONFIGURATION_RELATIONSHIP_INFERENCE_SOURCES = new Set([
  "inventory-static-site-backend",
  "inventory-fabric-capacity-workspace",
  "inventory-diagnostic-setting-storage",
]);

function hasConfigurationRelationshipEdges(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): boolean {
  return (
    outline?.edges.some((edge) => {
      const source = edge.inferenceSource?.trim().toLowerCase() ?? "";

      return CONFIGURATION_RELATIONSHIP_INFERENCE_SOURCES.has(source);
    }) === true
  );
}

export function buildInfraEvidencePngReadingStripLines(
  input: InfraEvidencePngReadingStripInput,
): readonly string[] {
  const lines: string[] = [];

  if (input.snapshotLabel !== undefined) {
    lines.push(pngSnapshotLabelLine(input.snapshotLabel));
  }

  const resourceGroupScopeLine = pngResourceGroupScopeLine(input.resourceGroupScopeName);

  if (resourceGroupScopeLine !== null) {
    lines.push(resourceGroupScopeLine);
  }

  const dependencyScopeLine = pngDependencyNeighborhoodScopeLine(input.dependencyNeighborhoodSeedLabel);

  if (dependencyScopeLine !== null) {
    lines.push(dependencyScopeLine);
  }

  if (input.mode === null || input.mode === undefined) {
    lines.push("Diagram mode was not stored.");
  } else if (input.mode === "") {
    lines.push("Diagram mode was stored empty.");
  } else if (input.mode === "dataFlow") {
    lines.push("This diagram shows what may connect. It is not observed traffic.");
  } else if (input.mode === "dataArchitecture") {
    lines.push("This diagram shows what stores data. It is not observed traffic.");
  } else if (
    input.mode === "network" ||
    input.mode === "executive" ||
    input.mode === "identity" ||
    input.mode === "data"
  ) {
    lines.push("This diagram shows inventory structure. It is not observed traffic.");
  }

  if (input.outline === null || input.outline === undefined) {
    lines.push("Diagram outline was not stored.");
  } else if (hasObservedEdges(input.outline)) {
    lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED);
  }

  if (input.outline !== null && input.outline !== undefined) {
    if (hasInfraEvidenceDeclaredDiagramEdges(input.outline)) {
      lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED);
    }

    if (hasInfraEvidenceProbableDiagramEdges(input.outline)) {
      lines.push(resolveInfraEvidenceDiagramLegendProbableLine(input.outline));
    }

    if (hasConfigurationRelationshipEdges(input.outline)) {
      lines.push(INFRA_EVIDENCE_DIAGRAM_PNG_CONFIGURATION_RELATIONSHIP_NOTE);
    }

    if (hasInfraEvidenceInferredDiagramEdges(input.outline)) {
      lines.push(resolveInfraEvidenceDiagramLegendInferredCopy(input.outline).legendLine);
    }
  }

  if (input.completenessWarnings.length > 0) {
    lines.push(
      `Inventory completeness warnings (${input.completenessWarnings.length}). Connection lines may be missing.`,
    );

    const warningTitles = input.completenessWarnings
      .slice(0, 3)
      .map((warning) => resolveInfraEvidenceCompletenessWarningPresentation(warning).title);

    lines.push(...warningTitles.map((title) => `Warning: ${title}`));

    if (input.completenessWarnings.length > warningTitles.length) {
      lines.push(`Warning: and ${input.completenessWarnings.length - warningTitles.length} more.`);
    }
  }

  return lines;
}

export async function appendInfraEvidencePngReadingStrip(
  blob: Blob,
  lines: readonly string[],
): Promise<Blob> {
  if (lines.length === 0) {
    return blob;
  }

  const bitmap = await createImageBitmap(blob);
  const footerHeight = Math.max(64, 28 + lines.length * 24);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height + footerHeight;

  const context = canvas.getContext("2d");

  if (context === null) {
    bitmap.close();
    return blob;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  context.fillStyle = "#111827";
  context.font = "16px sans-serif";
  lines.forEach((line, index) => {
    context.fillText(line, 16, bitmap.height + 28 + index * 24);
  });
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result === null) {
        reject(new Error("PNG reading strip could not be encoded."));
        return;
      }

      resolve(result);
    }, "image/png");
  });
}
