import {
  parseInfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const EXECUTIVE_OVERFLOW_LABEL = /^\+\d+ more /u;

const NODE_ID = /[A-Za-z0-9_-]+/u;
const NODE_SHAPE = /\[\[[^\]]+\]\]|\[[^\]]+\]|\(\([^)]+\)\)|\([^)]+\)|\{\{[^}]+\}\}|\{[^}]+\}|>[^<]+</u;
const LEADING_NODE_ID = new RegExp(`^${NODE_ID.source}`, "u");
const EDGE_ENDPOINTS = new RegExp(
  String.raw`^(${NODE_ID.source}?)\s*(?:${NODE_SHAPE.source})?\s*(?:-->|~~~|-\.->|==+>?)\s*(?:\|[^|]*\|\s*)?(${NODE_ID.source})`,
  "u",
);

export function isInfraEvidenceExecutiveOverflowOutlineNode(
  node: InfraEvidenceMermaidOutlineNode,
): boolean {
  return EXECUTIVE_OVERFLOW_LABEL.test(node.label.trim());
}

function readLeadingNodeId(line: string): string | null {
  return LEADING_NODE_ID.exec(line.trimStart())?.[0] ?? null;
}

function lineDefinesOverflowNode(line: string, overflowIds: ReadonlySet<string>): boolean {
  const nodeId = readLeadingNodeId(line);

  return nodeId != null && overflowIds.has(nodeId);
}

function lineConnectsOverflowNode(line: string, overflowIds: ReadonlySet<string>): boolean {
  const [, fromId, toId] = EDGE_ENDPOINTS.exec(line.trimStart()) ?? [];

  return (fromId !== undefined && overflowIds.has(fromId))
    || (toId !== undefined && overflowIds.has(toId));
}

export function isInfraEvidenceOutlineOnlyCanvasExcludedNode(
  node: InfraEvidenceMermaidOutlineNode,
): boolean {
  return node.outlineOnlyOnCanvas === true || isInfraEvidenceExecutiveOverflowOutlineNode(node);
}

function lineIsOutlineOnlyMetadataComment(line: string): boolean {
  const trimmed = line.trim();

  return trimmed.startsWith("%%") && trimmed.includes("al-outline-only=true");
}

/** Removes outline-only nodes (Executive rollups, unresolved NSG policy) from Mermaid used to paint the canvas; outline parsing keeps the full source. */
export function stripExecutiveOverflowNodesFromInfraEvidenceMermaid(source: string): string {
  if (source.trim().length === 0) {
    return source;
  }

  const outline = parseInfraEvidenceMermaidOutline(source);
  const overflowIds = new Set(
    outline.nodes.filter(isInfraEvidenceOutlineOnlyCanvasExcludedNode).map((node) => node.id),
  );

  if (overflowIds.size === 0) {
    return source;
  }

  return source
    .split("\n")
    .filter(
      (line) =>
        !lineIsOutlineOnlyMetadataComment(line)
        && !lineDefinesOverflowNode(line, overflowIds)
        && !lineConnectsOverflowNode(line, overflowIds),
    )
    .join("\n");
}
