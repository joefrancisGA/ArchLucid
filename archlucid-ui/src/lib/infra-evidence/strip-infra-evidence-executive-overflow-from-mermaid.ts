import {
  parseInfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

const EXECUTIVE_OVERFLOW_LABEL = /^\+\d+ more /u;

const NODE_WITH_LABEL =
  /^([A-Za-z0-9_-]+)(?:\[\[([^\]]+)\]\]|\[([^\]]+)\]|\(\(([^)]+)\)\)|\(([^)]+)\)|\{\{([^}]+)\}\}|\{([^}]+)\}|>([^<]+)<)?/u;

export function isInfraEvidenceExecutiveOverflowOutlineNode(
  node: InfraEvidenceMermaidOutlineNode,
): boolean {
  return EXECUTIVE_OVERFLOW_LABEL.test(node.label.trim());
}

function readLeadingNodeId(line: string): string | null {
  const trimmed = line.trim();
  const match = NODE_WITH_LABEL.exec(trimmed);

  if (match == null) {
    return null;
  }

  return match[1] ?? null;
}

function lineDefinesOverflowNode(line: string, overflowIds: ReadonlySet<string>): boolean {
  const nodeId = readLeadingNodeId(line);

  return nodeId != null && overflowIds.has(nodeId);
}

function lineConnectsOverflowNode(line: string, overflowIds: ReadonlySet<string>): boolean {
  if (!line.includes("-->") && !line.includes("~~~") && !line.includes("-.->") && !line.includes("==")) {
    return false;
  }

  for (const overflowId of overflowIds) {
    if (line.includes(overflowId)) {
      return true;
    }
  }

  return false;
}

/** Removes Executive "+N more …" rollup nodes from Mermaid used to paint the canvas; outline parsing keeps the full source. */
export function stripExecutiveOverflowNodesFromInfraEvidenceMermaid(source: string): string {
  if (source.trim().length === 0) {
    return source;
  }

  const outline = parseInfraEvidenceMermaidOutline(source);
  const overflowIds = new Set(
    outline.nodes
      .filter(isInfraEvidenceExecutiveOverflowOutlineNode)
      .map((node) => node.id),
  );

  if (overflowIds.size === 0) {
    return source;
  }

  return source
    .split("\n")
    .filter((line) => !lineDefinesOverflowNode(line, overflowIds) && !lineConnectsOverflowNode(line, overflowIds))
    .join("\n");
}
