import type { GraphEdgeVm, GraphNodeVm, GraphViewModel } from "@/types/graph";

export const GRAPH_VIEW_MODEL_EXPORT_NODE_LABEL_NOT_STORED = "Node label was not stored." as const;

export const GRAPH_VIEW_MODEL_EXPORT_RELATIONSHIP_TYPE_NOT_STORED =
  "Relationship type was not stored." as const;

export type GraphStaticExportMeta = {
  readonly runId: string;
  readonly mode: string;
  readonly generatedAtUtc: string;
  /** Present when export respects the UI node-type filter (same subgraph as the canvas). */
  readonly typeFilterApplied: string | null;
};

/** Stable JSON snapshot of the graph currently shown in the viewer (for tickets, offline diff, IaC docs). */
function graphNodeExportLabel(node: GraphNodeVm): string {
  const trimmed = node.label.trim();

  return trimmed.length > 0 ? trimmed : GRAPH_VIEW_MODEL_EXPORT_NODE_LABEL_NOT_STORED;
}

function graphEdgeExportType(edge: GraphEdgeVm): string {
  const trimmed = edge.type.trim();

  return trimmed.length > 0 ? trimmed : GRAPH_VIEW_MODEL_EXPORT_RELATIONSHIP_TYPE_NOT_STORED;
}

export function graphViewModelToJsonSnapshot(
  graph: GraphViewModel,
  meta: GraphStaticExportMeta,
): string {
  const payload = {
    exportKind: "ArchLucid.GraphViewModel.v1",
    meta,
    nodes: graph.nodes.map((node) => ({
      ...node,
      label: graphNodeExportLabel(node),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      type: graphEdgeExportType(edge),
    })),
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

function escapeMermaidLabel(raw: string): string {
  const singleLine = raw.replace(/\s+/g, " ").trim();

  return singleLine.replace(/"/g, "'").slice(0, 160);
}

function sanitizeMermaidIdentifier(raw: string): string {
  const underscored = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const trimmed = underscored.replace(/^_+|_+$/g, "");
  const base = trimmed.length > 0 ? trimmed : "n";

  if (/^[0-9]/.test(base)) {
    return `n_${base}`;
  }

  return base;
}

/**
 * Deterministic Mermaid flowchart for the loaded view — suitable for paste into Markdown or Mermaid Live Editor.
 * Skips edges whose endpoints are missing from `nodes` after id mapping.
 */
export function graphViewModelToMermaidFlowchart(graph: GraphViewModel): string {
  const lines: string[] = ["flowchart LR"];

  const idMap = new Map<string, string>();
  const usedIds = new Set<string>();

  for (const node of graph.nodes) {
    let candidate = sanitizeMermaidIdentifier(node.id);
    let suffix = 0;

    while (usedIds.has(candidate)) {
      suffix += 1;
      candidate = `${sanitizeMermaidIdentifier(node.id)}_${suffix}`;
    }

    usedIds.add(candidate);
    idMap.set(node.id, candidate);

    const label = escapeMermaidLabel(graphNodeExportLabel(node));

    lines.push(`  ${candidate}["${label}"]`);
  }

  for (const edge of graph.edges) {
    const src = idMap.get(edge.source);
    const tgt = idMap.get(edge.target);

    if (src === undefined || tgt === undefined) {
      continue;
    }

    const rel = escapeMermaidLabel(graphEdgeExportType(edge));

    lines.push(`  ${src} -->|"${rel}"| ${tgt}`);
  }

  return `${lines.join("\n")}\n`;
}

/** Filename segment safe on Windows/macOS/Linux downloads. */
export function safeGraphExportFilenameSegment(raw: string): string {
  const t = raw.trim();

  if (t.length === 0) {
    return "run";
  }

  return t.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_").slice(0, 96);
}

/** Browser download helper — revokes the object URL after the click. */
export function downloadBrowserTextFile(filename: string, body: string, mimeType: string): void {
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();

  URL.revokeObjectURL(url);
}
