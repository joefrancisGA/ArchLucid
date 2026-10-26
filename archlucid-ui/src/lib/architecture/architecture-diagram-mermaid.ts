import {
  ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX,
} from "@/lib/architecture/architecture-diagram-copy";
import type { ArchitectureDiagramModel, ArchitectureDiagramNode } from "@/lib/architecture/architecture-diagram-types";
import {
  resolveArchitectureDiagramEdgeDisplayLabel,
  resolveArchitectureDiagramNodeDisplayLabel,
} from "@/lib/architecture/architecture-diagram-provenance";
import { wrapArchitectureDiagramLabelForMermaidSource } from "@/lib/architecture/wrap-architecture-diagram-label";

const TRUST_BOUNDARY_LABEL_NOT_STORED = "Trust boundary label was not stored.";
const NO_ARCHITECTURE_COMPONENTS_RECORDED = "No architecture components were recorded.";

export type ArchitectureDiagramMermaidOptions = {
  readonly dark?: boolean;
};

function escapeMermaidLabel(raw: string, peerResourceNames: readonly string[]): string {
  const singleLine = raw.replace(/\s+/g, " ").trim();
  const escaped = singleLine.replace(/"/g, "'").slice(0, 160);

  return wrapArchitectureDiagramLabelForMermaidSource(escaped, peerResourceNames);
}

function nodeClassNames(node: ArchitectureDiagramNode): string {
  if (node.provenance === "asserted" || node.accepted) {
    return "assertedNode";
  }

  return "inferredNode";
}

function mermaidClassDefLines(dark: boolean): string[] {
  if (dark) {
    return [
      "  classDef assertedNode fill:#134e4a,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc",
      "  classDef inferredNode fill:#1e293b,stroke:#94a3b8,stroke-width:1px,stroke-dasharray:5 5,color:#f8fafc",
    ];
  }

  return [
    "  classDef assertedNode fill:#ecfeff,stroke:#0f766e,stroke-width:2px,color:#0f172a",
    "  classDef inferredNode fill:#f8fafc,stroke:#64748b,stroke-width:1px,stroke-dasharray:5 5,color:#0f172a",
  ];
}

function formatTrustBoundarySubgraphLabel(labels: readonly string[], peerResourceNames: readonly string[]): string {
  const joined = labels
    .map((label) => escapeMermaidLabel(label, peerResourceNames))
    .filter((label) => label.length > 0)
    .join(" / ");

  return joined.length > 0 ? joined : TRUST_BOUNDARY_LABEL_NOT_STORED;
}

function renderNodeLine(
  node: ArchitectureDiagramNode,
  indent: string,
  peerResourceNames: readonly string[],
): string {
  const className = nodeClassNames(node);
  const suffix = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";
  const displayLabel = resolveArchitectureDiagramNodeDisplayLabel(node.label);
  const label = escapeMermaidLabel(`${displayLabel}${suffix}`, peerResourceNames);

  return `${indent}${node.id}["${label}"]:::${className}`;
}

export function architectureDiagramModelToMermaid(
  model: ArchitectureDiagramModel,
  options: ArchitectureDiagramMermaidOptions = {},
): string {
  const lines: string[] = ["flowchart TB"];
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const dark = options.dark ?? false;
  const peerResourceNames = activeNodes.map((node) => node.label);

  if (activeNodes.length === 0) {
    const emptyLabel = escapeMermaidLabel(NO_ARCHITECTURE_COMPONENTS_RECORDED, []);
    return `flowchart TB\n  empty["${emptyLabel}"]\n`;
  }

  lines.push(...mermaidClassDefLines(dark));

  const boundaryNodes = activeNodes.filter((node) => node.kind === "system");
  const outsideBoundaryNodes = activeNodes.filter((node) => node.kind !== "system");
  const hasTrustBoundary = model.trustBoundaryLabels.length > 0 && boundaryNodes.length > 0;

  if (hasTrustBoundary) {
    lines.push(`  subgraph trustBoundary["${formatTrustBoundarySubgraphLabel(model.trustBoundaryLabels, peerResourceNames)}"]`);

    for (const node of boundaryNodes) {
      lines.push(renderNodeLine(node, "    ", peerResourceNames));
    }

    lines.push("  end");
  } else {
    for (const node of boundaryNodes) {
      lines.push(renderNodeLine(node, "  ", peerResourceNames));
    }
  }

  for (const node of outsideBoundaryNodes) {
    lines.push(renderNodeLine(node, "  ", peerResourceNames));
  }

  const activeEdges = model.edges.filter((edge) => !edge.removed);

  for (const edge of activeEdges) {
    const sourceExists = activeNodes.some((node) => node.id === edge.sourceId);
    const targetExists = activeNodes.some((node) => node.id === edge.targetId);

    if (!sourceExists || !targetExists) {
      continue;
    }

    const inferredSuffix = edge.provenance === "inferred" ? " (inferred)" : "";
    const displayLabel = resolveArchitectureDiagramEdgeDisplayLabel(edge);
    const label = escapeMermaidLabel(`${displayLabel}${inferredSuffix}`, peerResourceNames);
    const edgeStyle = edge.provenance === "inferred" ? "-.->" : "-->";

    lines.push(`  ${edge.sourceId} ${edgeStyle}|"${label}"| ${edge.targetId}`);
  }

  return `${lines.join("\n")}\n`;
}

export function architectureDiagramModelToTextAlternative(model: ArchitectureDiagramModel): string {
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const nodeLabelById = new Map(activeNodes.map((node) => [node.id, node.label]));
  const activeEdges = model.edges.filter(
    (edge) => !edge.removed && nodeLabelById.has(edge.sourceId) && nodeLabelById.has(edge.targetId),
  );
  if (activeNodes.length === 0) {
    return NO_ARCHITECTURE_COMPONENTS_RECORDED;
  }

  const nodeLines = activeNodes.map((node) => {
    const inferred = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";
    const displayLabel = resolveArchitectureDiagramNodeDisplayLabel(node.label);

    return `${node.kind}: ${displayLabel}${inferred}`;
  });
  const edgeLines = activeEdges.map((edge) => {
    const sourceLabel = resolveArchitectureDiagramNodeDisplayLabel(
      nodeLabelById.get(edge.sourceId) ?? edge.sourceId,
    );
    const targetLabel = resolveArchitectureDiagramNodeDisplayLabel(
      nodeLabelById.get(edge.targetId) ?? edge.targetId,
    );
    const inferred = edge.provenance === "inferred" ? " (inferred)" : "";
    const displayEdgeLabel = resolveArchitectureDiagramEdgeDisplayLabel(edge);
    const detail =
      displayEdgeLabel === "Connection label was not stored." ||
      displayEdgeLabel === "Connection label was stored empty."
        ? ` (${displayEdgeLabel})`
        : displayEdgeLabel.length > 0
          ? ` (${displayEdgeLabel})`
          : "";

    return `${sourceLabel} to ${targetLabel}${detail}${inferred}`;
  });
  const boundaryLine =
    model.trustBoundaryLabels.length > 0 ? `Trust boundaries: ${model.trustBoundaryLabels.join(", ")}` : null;
  const unmatchedLines = model.unmatchedDataFlows.map(
    (flow) => `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} ${flow}`,
  );

  return [nodeLines.join("; "), edgeLines.join("; "), boundaryLine, ...unmatchedLines]
    .filter((line) => line !== null && line.length > 0)
    .join(". ");
}

export function isValidMermaidArchitectureDiagram(source: string): boolean {
  const trimmed = source.trim();

  return trimmed.startsWith("flowchart") || trimmed.startsWith("graph ");
}
