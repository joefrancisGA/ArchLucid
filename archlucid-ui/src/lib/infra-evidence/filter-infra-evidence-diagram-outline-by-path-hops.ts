import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { securityEvidencePathHopNodeName } from "@/lib/security-evidence-path-types";
import type { SecurityEvidencePathHop } from "@/lib/security-evidence-path-types";

function normalizeMatchToken(value: string): string {
  return value.trim().toLowerCase();
}

function hopMatchTokens(hop: SecurityEvidencePathHop): readonly string[] {
  const tokens = new Set<string>();

  const cloudResourceId = hop.cloudResourceId?.trim() ?? "";

  if (cloudResourceId.length > 0) {
    tokens.add(normalizeMatchToken(cloudResourceId));
  }

  for (const label of [hop.fromNodeLabel, hop.toNodeLabel]) {
    const trimmed = label.trim();

    if (trimmed.length > 0) {
      tokens.add(normalizeMatchToken(trimmed));
      tokens.add(normalizeMatchToken(securityEvidencePathHopNodeName(trimmed)));
    }
  }

  return [...tokens];
}

function nodeMatchesPathHop(node: InfraEvidenceMermaidOutline["nodes"][number], tokens: ReadonlySet<string>): boolean {
  const nodeId = normalizeMatchToken(node.id);
  const nodeLabel = normalizeMatchToken(node.label);
  const resourceName = normalizeMatchToken(node.label.split(" · ", 1)[0] ?? node.label);

  for (const token of tokens) {
    if (token.length === 0) {
      continue;
    }

    if (nodeId === token || nodeLabel.includes(token) || resourceName.includes(token)) {
      return true;
    }
  }

  return false;
}

/** Keeps hop endpoints and edges between matched nodes for SecureNow path-focused diagrams. */
export function filterInfraEvidenceDiagramOutlineByPathHops(
  outline: InfraEvidenceMermaidOutline | null,
  hops: readonly SecurityEvidencePathHop[],
): InfraEvidenceMermaidOutline | null {
  if (outline == null || hops.length === 0) {
    return outline;
  }

  const tokens = new Set<string>();

  for (const hop of hops) {
    for (const token of hopMatchTokens(hop)) {
      tokens.add(token);
    }
  }

  if (tokens.size === 0) {
    return outline;
  }

  const matchedNodeIds = new Set(
    outline.nodes.filter((node) => nodeMatchesPathHop(node, tokens)).map((node) => node.id),
  );

  if (matchedNodeIds.size === 0) {
    return { ...outline, nodes: [], edges: [] };
  }

  const edges = outline.edges.filter(
    (edge) => matchedNodeIds.has(edge.from) && matchedNodeIds.has(edge.to),
  );
  const connectedNodeIds = new Set<string>();

  for (const edge of edges) {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  }

  const nodes = outline.nodes.filter((node) => connectedNodeIds.has(node.id));

  return {
    ...outline,
    nodes,
    edges,
  };
}
