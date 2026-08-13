import type { ArchitectureDiagramModel, ArchitectureDiagramNode } from "@/lib/architecture/architecture-diagram-types";

export type ArchitectureDiagramMermaidOptions = {
  readonly dark?: boolean;
};

function escapeMermaidLabel(raw: string): string {
  const singleLine = raw.replace(/\s+/g, " ").trim();

  return singleLine.replace(/"/g, "'").slice(0, 160);
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

function formatTrustBoundarySubgraphLabel(labels: readonly string[]): string {
  const joined = labels.map((label) => escapeMermaidLabel(label)).filter((label) => label.length > 0).join(" / ");

  return joined.length > 0 ? joined : "Trust boundary";
}

function renderNodeLine(node: ArchitectureDiagramNode, indent: string): string {
  const className = nodeClassNames(node);
  const suffix = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";
  const label = escapeMermaidLabel(`${node.label}${suffix}`);

  return `${indent}${node.id}["${label}"]:::${className}`;
}

export function architectureDiagramModelToMermaid(
  model: ArchitectureDiagramModel,
  options: ArchitectureDiagramMermaidOptions = {},
): string {
  const lines: string[] = ["flowchart TB"];
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const dark = options.dark ?? false;

  if (activeNodes.length === 0) {
    return "flowchart TB\n  empty[\"No components available\"]";
  }

  lines.push(...mermaidClassDefLines(dark));

  const boundaryNodes = activeNodes.filter((node) => node.kind === "system");
  const outsideBoundaryNodes = activeNodes.filter((node) => node.kind !== "system");
  const hasTrustBoundary = model.trustBoundaryLabels.length > 0 && boundaryNodes.length > 0;

  if (hasTrustBoundary) {
    lines.push(`  subgraph trustBoundary["${formatTrustBoundarySubgraphLabel(model.trustBoundaryLabels)}"]`);

    for (const node of boundaryNodes) {
      lines.push(renderNodeLine(node, "    "));
    }

    lines.push("  end");
  } else {
    for (const node of boundaryNodes) {
      lines.push(renderNodeLine(node, "  "));
    }
  }

  for (const node of outsideBoundaryNodes) {
    lines.push(renderNodeLine(node, "  "));
  }

  const activeEdges = model.edges.filter((edge) => !edge.removed);

  for (const edge of activeEdges) {
    const sourceExists = activeNodes.some((node) => node.id === edge.sourceId);
    const targetExists = activeNodes.some((node) => node.id === edge.targetId);

    if (!sourceExists || !targetExists) {
      continue;
    }

    const inferredSuffix = edge.provenance === "inferred" ? " (inferred)" : "";
    const label = escapeMermaidLabel(`${edge.label}${inferredSuffix}`);
    const edgeStyle = edge.provenance === "inferred" ? "-.->" : "-->";

    lines.push(`  ${edge.sourceId} ${edgeStyle}|"${label}"| ${edge.targetId}`);
  }

  return `${lines.join("\n")}\n`;
}

export function architectureDiagramModelToTextAlternative(model: ArchitectureDiagramModel): string {
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const nodeLabelById = new Map(activeNodes.map((node) => [node.id, node.label]));
  const nodeLines = activeNodes.map((node) => {
    const inferred = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";

    return `${node.kind}: ${node.label}${inferred}`;
  });
  const edgeLines = activeEdges.map((edge) => {
    const sourceLabel = nodeLabelById.get(edge.sourceId) ?? edge.sourceId;
    const targetLabel = nodeLabelById.get(edge.targetId) ?? edge.targetId;
    const inferred = edge.provenance === "inferred" ? " (inferred)" : "";
    const detail = edge.label.length > 0 ? ` (${edge.label})` : "";

    return `${sourceLabel} to ${targetLabel}${detail}${inferred}`;
  });
  const boundaryLine =
    model.trustBoundaryLabels.length > 0 ? `Trust boundaries: ${model.trustBoundaryLabels.join(", ")}` : null;

  return [nodeLines.join("; "), edgeLines.join("; "), boundaryLine].filter((line) => line !== null && line.length > 0).join(". ");
}

export function isValidMermaidArchitectureDiagram(source: string): boolean {
  const trimmed = source.trim();

  return trimmed.startsWith("flowchart") || trimmed.startsWith("graph ");
}
