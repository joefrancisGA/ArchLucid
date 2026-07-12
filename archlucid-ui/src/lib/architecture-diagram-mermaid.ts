import type { ArchitectureDiagramModel, ArchitectureDiagramNode } from "@/lib/architecture-diagram-types";

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

export function architectureDiagramModelToMermaid(model: ArchitectureDiagramModel): string {
  const lines: string[] = ["flowchart TB"];
  const activeNodes = model.nodes.filter((node) => !node.removed);

  if (activeNodes.length === 0) {
    return "flowchart TB\n  empty[\"No components available\"]";
  }

  lines.push("  classDef assertedNode fill:#ecfeff,stroke:#0f766e,stroke-width:2px");
  lines.push("  classDef inferredNode fill:#f8fafc,stroke:#64748b,stroke-width:1px,stroke-dasharray:5 5");

  if (model.trustBoundaryLabels.length > 0) {
    lines.push(`  subgraph trustBoundary["Trust boundary"]`);
  }

  for (const node of activeNodes) {
    const className = nodeClassNames(node);
    const suffix = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";
    const label = escapeMermaidLabel(`${node.label}${suffix}`);

    lines.push(`    ${node.id}["${label}"]:::${className}`);
  }

  if (model.trustBoundaryLabels.length > 0) {
    lines.push("  end");
  }

  const activeEdges = model.edges.filter((edge) => !edge.removed);

  for (const edge of activeEdges) {
    const sourceExists = activeNodes.some((node) => node.id === edge.sourceId);
    const targetExists = activeNodes.some((node) => node.id === edge.targetId);

    if (!sourceExists || !targetExists) {
      continue;
    }

    const label = escapeMermaidLabel(edge.label);
    const edgeStyle = edge.provenance === "inferred" ? "-.->" : "-->";

    lines.push(`  ${edge.sourceId} ${edgeStyle}|"${label}"| ${edge.targetId}`);
  }

  return `${lines.join("\n")}\n`;
}

export function architectureDiagramModelToTextAlternative(model: ArchitectureDiagramModel): string {
  const activeNodes = model.nodes.filter((node) => !node.removed);
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const nodeLines = activeNodes.map((node) => {
    const inferred = node.provenance === "inferred" && !node.accepted ? " (inferred)" : "";

    return `${node.kind}: ${node.label}${inferred}`;
  });
  const edgeLines = activeEdges.map((edge) => `${edge.sourceId} to ${edge.targetId}${edge.label.length > 0 ? ` (${edge.label})` : ""}`);
  const boundaryLine =
    model.trustBoundaryLabels.length > 0 ? `Trust boundaries: ${model.trustBoundaryLabels.join(", ")}` : null;

  return [nodeLines.join("; "), edgeLines.join("; "), boundaryLine].filter((line) => line !== null && line.length > 0).join(". ");
}

export function isValidMermaidArchitectureDiagram(source: string): boolean {
  const trimmed = source.trim();

  return trimmed.startsWith("flowchart") || trimmed.startsWith("graph ");
}
