/** Lightweight Mermaid flowchart outline for accessible diagram peers (nodes + edges only). */

export type InfraEvidenceMermaidOutlineNode = {
  readonly id: string;
  readonly label: string;
};

export type InfraEvidenceMermaidOutlineEdge = {
  readonly from: string;
  readonly to: string;
  readonly label: string | null;
};

export type InfraEvidenceMermaidOutline = {
  readonly nodes: readonly InfraEvidenceMermaidOutlineNode[];
  readonly edges: readonly InfraEvidenceMermaidOutlineEdge[];
};

const NODE_WITH_LABEL =
  /^([A-Za-z0-9_-]+)(?:\[\[([^\]]+)\]\]|\[([^\]]+)\]|\(\(([^)]+)\)\)|\(([^)]+)\)|\{\{([^}]+)\}\}|\{([^}]+)\}|>([^<]+)<)?/u;

const EDGE_ARROW = /--+(?:\|([^|]+)\|)?>|==+(?:\|([^|]+)\|)?>|\.-+>/u;

const DIAGRAM_HEADER = /^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|erDiagram|gantt|pie|mindmap|timeline|gitGraph|C4Context)\b/u;

const SUBGRAPH_LINE = /^subgraph\b/u;

function isMermaidOutlineStructureLine(line: string): boolean {
  if (line === "end") {
    return true;
  }

  if (SUBGRAPH_LINE.test(line)) {
    return true;
  }

  if (/^direction\b/u.test(line)) {
    return true;
  }

  return false;
}

function normalizeOutlineLabel(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim() ?? "";

  if (trimmed.length === 0) {
    return fallback;
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function readNodeToken(token: string): InfraEvidenceMermaidOutlineNode | null {
  const match = NODE_WITH_LABEL.exec(token.trim());

  if (match == null) {
    return null;
  }

  const id = match[1];
  const label = normalizeOutlineLabel(
    match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7] ?? match[8],
    id,
  );

  return { id, label };
}

function upsertNode(
  nodeMap: Map<string, InfraEvidenceMermaidOutlineNode>,
  node: InfraEvidenceMermaidOutlineNode,
): void {
  const existing = nodeMap.get(node.id);

  if (existing != null && existing.label !== existing.id) {
    return;
  }

  nodeMap.set(node.id, node);
}

export function parseInfraEvidenceMermaidOutline(source: string): InfraEvidenceMermaidOutline {
  const nodeMap = new Map<string, InfraEvidenceMermaidOutlineNode>();
  const edges: InfraEvidenceMermaidOutlineEdge[] = [];

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (line.length === 0 || line.startsWith("%%") || line.startsWith("classDef ") || line.startsWith("class ") || DIAGRAM_HEADER.test(line)) {
      continue;
    }

    if (isMermaidOutlineStructureLine(line)) {
      continue;
    }

    const arrowMatch = EDGE_ARROW.exec(line);

    if (arrowMatch != null) {
      const arrowIndex = arrowMatch.index;
      const fromToken = line.slice(0, arrowIndex).trim();
      const toToken = line.slice(arrowIndex + arrowMatch[0].length).trim();
      const fromNode = readNodeToken(fromToken);
      const toNode = readNodeToken(toToken);
      const edgeLabel = normalizeOutlineLabel(arrowMatch[1] ?? arrowMatch[2], "");

      if (fromNode != null) {
        upsertNode(nodeMap, fromNode);
      }

      if (toNode != null) {
        upsertNode(nodeMap, toNode);
      }

      if (fromNode != null && toNode != null) {
        edges.push({
          from: fromNode.id,
          to: toNode.id,
          label: edgeLabel.length > 0 ? edgeLabel : null,
        });
      }

      continue;
    }

    const standaloneNode = readNodeToken(line);

    if (standaloneNode != null) {
      upsertNode(nodeMap, standaloneNode);
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges,
  };
}
