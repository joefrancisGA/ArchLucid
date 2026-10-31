import {
  INFRA_EVIDENCE_DIAGRAM_BUSINESS_CONTINUITY_READING_LEGEND,
  INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED,
  INFRA_EVIDENCE_DIAGRAM_LEGEND_UNCLASSIFIED_PROVENANCE,
  INFRA_EVIDENCE_DIAGRAM_PNG_CONFIGURATION_RELATIONSHIP_NOTE,
  INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE,
} from "@/lib/infra-evidence/infra-evidence-diagram-copy";
import { resolveInfraEvidenceDiagramLegendInferredCopy } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-inferred-line";
import { resolveInfraEvidenceDiagramLegendProbableLine } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-legend-probable-line";
import {
  hasInfraEvidenceDeclaredDiagramEdges,
  hasInfraEvidenceInferredDiagramEdges,
  hasInfraEvidenceProbableDiagramEdges,
  hasInfraEvidenceUnclassifiedDiagramEdges,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceCompletenessWarningPresentation } from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";
import { INFRA_DIAGRAMS_MODE_OPTIONS } from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";

const INVENTORY_STRUCTURE_MODE_READING_SENTENCE =
  "This diagram shows inventory structure. It is not observed traffic." as const;

const INVENTORY_STRUCTURE_PICKER_MODES = new Set([
  "full",
  "architecture",
  "security",
  "avd",
  "businessContinuity",
  "resourceGroup",
  "selectedResources",
  "dependencyNeighborhood",
]);

function resolveInventoryStructureModeReadingLine(mode: string): string | null {
  if (!INVENTORY_STRUCTURE_PICKER_MODES.has(mode)) {
    return null;
  }

  const option = INFRA_DIAGRAMS_MODE_OPTIONS.find((entry) => entry.value === mode);

  if (option === undefined) {
    return null;
  }

  return `${option.label}. ${INVENTORY_STRUCTURE_MODE_READING_SENTENCE}`;
}

export const INFRA_EVIDENCE_PNG_SNAPSHOT_LABEL_NOT_STORED = "Snapshot label was not stored." as const;
export const INFRA_EVIDENCE_PNG_RESOURCE_GROUP_SCOPE_NOT_STORED =
  "Resource group scope was not stored." as const;
export const INFRA_EVIDENCE_PNG_DEPENDENCY_NEIGHBORHOOD_SCOPE_NOT_STORED =
  "Dependency neighborhood starting resource was not stored." as const;

export const INFRA_EVIDENCE_PNG_STARTING_RESOURCE_NAME_NOT_STORED =
  "Starting resource name was not stored." as const;

export type InfraEvidencePngReadingStripInput = {
  readonly mode: string | null | undefined;
  readonly outline: InfraEvidenceMermaidOutline | null | undefined;
  readonly completenessWarnings: readonly string[];
  readonly snapshotLabel?: string | null;
  readonly resourceGroupScopeName?: string | null;
  readonly dependencyNeighborhoodSeedId?: string | null;
  readonly dependencyNeighborhoodSeedDisplayName?: string | null;
  readonly layoutSvg?: string | null;
  readonly executiveOverflowStripped?: boolean;
  readonly includePrivateEndpointNodes?: boolean;
};

const EXECUTIVE_OVERFLOW_PNG_READING_LINE =
  "Executive overflow rollups and unresolved policy outlines stay in Mermaid but are not painted on this PNG." as const;

const PRIVATE_ENDPOINT_ALL_STATUSES_TRAFFIC_HEDGE =
  "Private endpoint links show inventory reachability for all stored connection statuses — not observed traffic." as const;

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

function pngDependencyNeighborhoodScopeLine(
  seedId: string | null | undefined,
  seedDisplayName: string | null | undefined,
): string | null {
  if (seedId === null || seedId === undefined) {
    return null;
  }

  const trimmedId = seedId.trim();

  if (trimmedId.length === 0) {
    return INFRA_EVIDENCE_PNG_DEPENDENCY_NEIGHBORHOOD_SCOPE_NOT_STORED;
  }

  const trimmedName = seedDisplayName?.trim() ?? "";

  if (trimmedName.length === 0) {
    return `${INFRA_EVIDENCE_PNG_STARTING_RESOURCE_NAME_NOT_STORED} Seed id: ${trimmedId}.`;
  }

  return `Scope: neighbors of ${trimmedName} on cited lines.`;
}

const CONFIGURATION_RELATIONSHIP_INFERENCE_SOURCES = new Set([
  "inventory-static-site-backend",
  "inventory-fabric-capacity-workspace",
  "inventory-diagnostic-setting-storage",
  "inventory-logic-app-connection",
  "inventory-aks-service-lb",
  "inventory-nsp-association",
  "inventory-node-pool",
  "inventory-ampls-scoped-resource",
]);

function isConfigurationRelationshipEdge(
  edge: InfraEvidenceMermaidOutline["edges"][number],
): boolean {
  const source = edge.inferenceSource?.trim().toLowerCase() ?? "";

  return CONFIGURATION_RELATIONSHIP_INFERENCE_SOURCES.has(source);
}

function hasStoredObservedFactEdges(outline: InfraEvidenceMermaidOutline | null | undefined): boolean {
  return (
    outline?.edges.some(
      (edge) =>
        !isConfigurationRelationshipEdge(edge)
        && edge.source === "observed"
        && (edge.provenanceKind?.trim().toLowerCase() ?? "") === "observedfact",
    ) === true
  );
}

function hasConfigurationRelationshipEdges(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): boolean {
  return outline?.edges.some((edge) => isConfigurationRelationshipEdge(edge)) === true;
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

  const dependencyScopeLine = pngDependencyNeighborhoodScopeLine(
    input.dependencyNeighborhoodSeedId,
    input.dependencyNeighborhoodSeedDisplayName,
  );

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
    lines.push(INFRA_EVIDENCE_DIAGRAM_DATA_ARCHITECTURE_READING_LEGEND);
  } else if (input.mode === "network") {
    lines.push(INFRA_EVIDENCE_DIAGRAM_PNG_NETWORK_PLACEMENT_NOTE);
  } else if (input.mode === "businessContinuity") {
    lines.push(INFRA_EVIDENCE_DIAGRAM_BUSINESS_CONTINUITY_READING_LEGEND);
  } else if (
    input.mode === "executive" ||
    input.mode === "identity" ||
    input.mode === "data"
  ) {
    lines.push(INVENTORY_STRUCTURE_MODE_READING_SENTENCE);

    if (input.mode === "executive" && input.executiveOverflowStripped === true) {
      lines.push(EXECUTIVE_OVERFLOW_PNG_READING_LINE);
    }
  } else {
    const inventoryModeLine = resolveInventoryStructureModeReadingLine(input.mode);

    if (inventoryModeLine !== null) {
      lines.push(inventoryModeLine);
    } else {
      lines.push(
        `Diagram mode was stored as ${input.mode}. It is not one of the labeled inventory modes.`,
      );
    }
  }

  if (input.outline === null || input.outline === undefined) {
    lines.push("Diagram outline was not stored.");
  } else if (hasStoredObservedFactEdges(input.outline)) {
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

    if (hasInfraEvidenceUnclassifiedDiagramEdges(input.outline, null)) {
      lines.push(INFRA_EVIDENCE_DIAGRAM_LEGEND_UNCLASSIFIED_PROVENANCE);
    }
  }

  if (input.includePrivateEndpointNodes === true) {
    lines.push(PRIVATE_ENDPOINT_ALL_STATUSES_TRAFFIC_HEDGE);
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
      const omitted = input.completenessWarnings.length - warningTitles.length;

      lines.push(`${omitted} additional warnings were not listed on this strip.`);
    }
  }

  return lines;
}

export function buildInfraMermaidExportLegendCommentLines(
  outline: InfraEvidenceMermaidOutline | null | undefined,
): readonly string[] {
  if (outline === null || outline === undefined) {
    return [];
  }

  const lines: string[] = [];

  if (hasStoredObservedFactEdges(outline)) {
    lines.push(`%% ${INFRA_EVIDENCE_DIAGRAM_LEGEND_OBSERVED}`);
  }

  if (hasInfraEvidenceDeclaredDiagramEdges(outline)) {
    lines.push(`%% ${INFRA_EVIDENCE_DIAGRAM_LEGEND_DECLARED}`);
  }

  if (hasInfraEvidenceProbableDiagramEdges(outline)) {
    lines.push(`%% ${resolveInfraEvidenceDiagramLegendProbableLine(outline)}`);
  }

  if (hasInfraEvidenceInferredDiagramEdges(outline)) {
    lines.push(`%% ${resolveInfraEvidenceDiagramLegendInferredCopy(outline).legendLine}`);
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
