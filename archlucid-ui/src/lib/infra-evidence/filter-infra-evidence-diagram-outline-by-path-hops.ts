import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { securityEvidencePathHopNodeName } from "@/lib/security-evidence-path-types";
import type { SecurityEvidencePathHop } from "@/lib/security-evidence-path-types";

export type SecureNowPathHopDiagramMatchBasis =
  | "cloudResourceId"
  | "hopLabels"
  | "none"
  | "unfiltered";

export type FilterInfraEvidenceDiagramOutlineByPathHopsResult = {
  readonly outline: InfraEvidenceMermaidOutline | null;
  readonly matchBasis: SecureNowPathHopDiagramMatchBasis;
};

function normalizeMatchToken(value: string): string {
  return value.trim().toLowerCase();
}

function hopCloudResourceIdTokens(hop: SecurityEvidencePathHop): readonly string[] {
  const cloudResourceId = hop.cloudResourceId?.trim() ?? "";

  if (cloudResourceId.length === 0) {
    return [];
  }

  return [normalizeMatchToken(cloudResourceId)];
}

function hopLabelMatchTokens(hop: SecurityEvidencePathHop): readonly string[] {
  const tokens = new Set<string>();

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

function filterOutlineToMatchedNodes(
  outline: InfraEvidenceMermaidOutline,
  matchedNodeIds: ReadonlySet<string>,
): InfraEvidenceMermaidOutline {
  if (matchedNodeIds.size === 0) {
    return { ...outline, nodes: [], edges: [] };
  }

  const edges = outline.edges.filter(
    (edge) => matchedNodeIds.has(edge.from) && matchedNodeIds.has(edge.to),
  );
  const connectedNodeIds = new Set<string>(matchedNodeIds);

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

/** Keeps hop endpoints and edges between matched nodes for SecureNow path-focused diagrams. */
export function filterInfraEvidenceDiagramOutlineByPathHopsWithBasis(
  outline: InfraEvidenceMermaidOutline | null,
  hops: readonly SecurityEvidencePathHop[],
): FilterInfraEvidenceDiagramOutlineByPathHopsResult {
  if (outline == null) {
    return { outline: null, matchBasis: "none" };
  }

  if (hops.length === 0) {
    return { outline, matchBasis: "unfiltered" };
  }

  const cloudResourceTokens = new Set<string>();
  const labelTokens = new Set<string>();

  for (const hop of hops) {
    for (const token of hopCloudResourceIdTokens(hop)) {
      cloudResourceTokens.add(token);
    }

    for (const token of hopLabelMatchTokens(hop)) {
      labelTokens.add(token);
    }
  }

  if (cloudResourceTokens.size > 0) {
    const cloudResourceMatchedNodeIds = new Set(
      outline.nodes
        .filter((node) => nodeMatchesPathHop(node, cloudResourceTokens))
        .map((node) => node.id),
    );

    if (cloudResourceMatchedNodeIds.size > 0) {
      return {
        outline: filterOutlineToMatchedNodes(outline, cloudResourceMatchedNodeIds),
        matchBasis: "cloudResourceId",
      };
    }
  }

  if (labelTokens.size === 0) {
    return { outline, matchBasis: "unfiltered" };
  }

  const labelMatchedNodeIds = new Set(
    outline.nodes.filter((node) => nodeMatchesPathHop(node, labelTokens)).map((node) => node.id),
  );

  return {
    outline: filterOutlineToMatchedNodes(outline, labelMatchedNodeIds),
    matchBasis: labelMatchedNodeIds.size > 0 ? "hopLabels" : "none",
  };
}

export function filterInfraEvidenceDiagramOutlineByPathHops(
  outline: InfraEvidenceMermaidOutline | null,
  hops: readonly SecurityEvidencePathHop[],
): InfraEvidenceMermaidOutline | null {
  return filterInfraEvidenceDiagramOutlineByPathHopsWithBasis(outline, hops).outline;
}
