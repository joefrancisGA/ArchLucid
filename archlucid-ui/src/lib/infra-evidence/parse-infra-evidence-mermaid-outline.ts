/** Lightweight Mermaid flowchart outline for accessible diagram peers (nodes + edges only). */

export type InfraEvidenceMermaidOutlineNode = {
  readonly id: string;
  readonly label: string;
  readonly resourceType: string | null;
  readonly resourceGroup: string | null;
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

const STRUCTURAL_LINE =
  /^(?:subgraph\b|end\b|direction\s+(?:TB|TD|BT|RL|LR|DT|DR)\b)/iu;

const SUBGRAPH_LABEL = /^subgraph\s+([A-Za-z0-9_-]+)(?:\["([^"]+)"\]|\[([^\]]+)\])?/iu;

const RG_SUBGRAPH_LABEL = /^RG\s+(.+)$/iu;

const OUTLINE_METADATA_TOKEN = /(?:^|\s)(al-type|al-rg)=("([^"\\]*(?:\\.[^"\\]*)*)"|([^\s]+))/gu;

type OutlineNodeMetadata = {
  readonly resourceType: string | null;
  readonly resourceGroup: string | null;
};

function normalizeOutlineLabel(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim() ?? "";

  if (trimmed.length === 0) {
    return fallback;
  }

  return trimmed.replace(/^["']|["']$/g, "");
}

function unquoteMetadataValue(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/\\"/gu, "\"");
  }

  return trimmed;
}

function parseOutlineNodeMetadata(comment: string): OutlineNodeMetadata {
  let resourceType: string | null = null;
  let resourceGroup: string | null = null;

  for (const match of comment.matchAll(OUTLINE_METADATA_TOKEN)) {
    const key = match[1];
    const value = unquoteMetadataValue(match[3] ?? match[4] ?? "");

    if (value.length === 0) {
      continue;
    }

    if (key === "al-type") {
      resourceType = value;
    }

    if (key === "al-rg") {
      resourceGroup = value;
    }
  }

  return { resourceType, resourceGroup };
}

function splitNodeLine(line: string): { readonly nodeToken: string; readonly metadata: OutlineNodeMetadata } {
  const commentIndex = line.indexOf("%%");

  if (commentIndex < 0) {
    return {
      nodeToken: line.trim(),
      metadata: { resourceType: null, resourceGroup: null },
    };
  }

  return {
    nodeToken: line.slice(0, commentIndex).trim(),
    metadata: parseOutlineNodeMetadata(line.slice(commentIndex)),
  };
}

function readNodeToken(
  token: string,
  metadata: OutlineNodeMetadata,
  subgraphResourceGroup: string | null,
): InfraEvidenceMermaidOutlineNode | null {
  const match = NODE_WITH_LABEL.exec(token.trim());

  if (match == null) {
    return null;
  }

  const id = match[1];
  const label = normalizeOutlineLabel(
    match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7] ?? match[8],
    id,
  );

  return {
    id,
    label,
    resourceType: metadata.resourceType,
    resourceGroup: metadata.resourceGroup ?? subgraphResourceGroup,
  };
}

function upsertNode(
  nodeMap: Map<string, InfraEvidenceMermaidOutlineNode>,
  node: InfraEvidenceMermaidOutlineNode,
): void {
  const existing = nodeMap.get(node.id);

  if (existing != null && existing.label !== existing.id) {
    if (existing.resourceType == null && node.resourceType != null) {
      nodeMap.set(node.id, { ...existing, resourceType: node.resourceType });
    }

    if (existing.resourceGroup == null && node.resourceGroup != null) {
      const next = nodeMap.get(node.id)!;

      nodeMap.set(node.id, { ...next, resourceGroup: node.resourceGroup });
    }

    return;
  }

  nodeMap.set(node.id, node);
}

function resolveSubgraphResourceGroup(label: string | null): string | null {
  if (label == null || label.trim().length === 0) {
    return null;
  }

  const match = RG_SUBGRAPH_LABEL.exec(label.trim());

  if (match == null) {
    return null;
  }

  const resourceGroup = match[1].trim();

  return resourceGroup.length > 0 ? resourceGroup : null;
}

function readSubgraphLabel(line: string): string | null {
  const match = SUBGRAPH_LABEL.exec(line.trim());

  if (match == null) {
    return null;
  }

  const label = normalizeOutlineLabel(match[2] ?? match[3], match[1]);

  return label.length > 0 ? label : null;
}

export function resolveInfraEvidenceOutlineNodeLabel(
  nodes: readonly InfraEvidenceMermaidOutlineNode[],
  nodeId: string,
): string {
  const match = nodes.find((node) => node.id === nodeId);

  if (match == null || match.label.trim().length === 0) {
    return nodeId;
  }

  return match.label;
}

export function parseInfraEvidenceMermaidOutline(source: string): InfraEvidenceMermaidOutline {
  const nodeMap = new Map<string, InfraEvidenceMermaidOutlineNode>();
  const edges: InfraEvidenceMermaidOutlineEdge[] = [];
  const subgraphResourceGroups: string[] = [];

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (
      line.length === 0
      || line.startsWith("%%")
      || line.startsWith("classDef ")
      || line.startsWith("class ")
      || DIAGRAM_HEADER.test(line)
    ) {
      continue;
    }

    if (/^end\b/iu.test(line)) {
      if (subgraphResourceGroups.length > 0) {
        subgraphResourceGroups.pop();
      }

      continue;
    }

    const subgraphLabel = readSubgraphLabel(line);

    if (subgraphLabel != null) {
      const resourceGroup = resolveSubgraphResourceGroup(subgraphLabel);

      if (resourceGroup != null) {
        subgraphResourceGroups.push(resourceGroup);
      }

      continue;
    }

    if (STRUCTURAL_LINE.test(line)) {
      continue;
    }

    const activeSubgraphResourceGroup =
      subgraphResourceGroups.length > 0 ? subgraphResourceGroups[subgraphResourceGroups.length - 1] : null;

    const arrowMatch = EDGE_ARROW.exec(line);

    if (arrowMatch != null) {
      const arrowIndex = arrowMatch.index;
      const fromParts = splitNodeLine(line.slice(0, arrowIndex));
      const toParts = splitNodeLine(line.slice(arrowIndex + arrowMatch[0].length));
      const fromNode = readNodeToken(fromParts.nodeToken, fromParts.metadata, activeSubgraphResourceGroup);
      const toNode = readNodeToken(toParts.nodeToken, toParts.metadata, activeSubgraphResourceGroup);
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

    const standaloneParts = splitNodeLine(line);
    const standaloneNode = readNodeToken(
      standaloneParts.nodeToken,
      standaloneParts.metadata,
      activeSubgraphResourceGroup,
    );

    if (standaloneNode != null) {
      upsertNode(nodeMap, standaloneNode);
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges,
  };
}
