import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import {
  resolveInfraEvidenceOutlineSeedNodeId,
  type InfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type DiagramOutlineUnknownNodeFilterScope =
  | "all"
  | "startingResourceGroup"
  | "diagramNeighbor";

export function resolveDiagramOutlineStartingNode(
  outline: InfraEvidenceMermaidOutline,
  startingSeedId: string | null | undefined,
): InfraEvidenceMermaidOutlineNode | null {
  const trimmedSeed = startingSeedId?.trim() ?? "";

  if (trimmedSeed.length === 0) {
    return null;
  }

  for (const node of outline.nodes) {
    if (node.id === trimmedSeed) {
      return node;
    }

    if (resolveInfraEvidenceOutlineSeedNodeId(node) === trimmedSeed) {
      return node;
    }
  }

  return null;
}

function normalizeCompareValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Layout adjacency on the rendered diagram — not network isolation or reachability proof. */
function resolveDiagramNeighborNodeIds(
  outline: InfraEvidenceMermaidOutline,
  startingDiagramNodeId: string,
): Set<string> {
  const neighborIds = new Set<string>([startingDiagramNodeId]);

  for (const edge of outline.edges) {
    if (edge.from === startingDiagramNodeId) {
      neighborIds.add(edge.to);
    }

    if (edge.to === startingDiagramNodeId) {
      neighborIds.add(edge.from);
    }
  }

  return neighborIds;
}

function nodeMatchesUnknownSearchQuery(
  node: InfraEvidenceMermaidOutlineNode,
  searchQuery: string,
): boolean {
  const trimmed = searchQuery.trim().toLowerCase();

  if (trimmed.length === 0) {
    return true;
  }

  const haystack = [
    resolveInfraEvidenceDiagramOutlineResourceName(node),
    formatDiagramArmTypeFriendlyName(node.resourceType) ?? node.resourceType ?? "",
    node.resourceGroup ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(trimmed);
}

export function filterDiagramOutlineUnknownNodes(input: {
  readonly nodes: readonly InfraEvidenceMermaidOutlineNode[];
  readonly outline: InfraEvidenceMermaidOutline;
  readonly startingSeedId: string | null | undefined;
  readonly scope: DiagramOutlineUnknownNodeFilterScope;
  readonly searchQuery: string;
}): readonly InfraEvidenceMermaidOutlineNode[] {
  const startingNode = resolveDiagramOutlineStartingNode(input.outline, input.startingSeedId);
  let scoped = input.nodes;

  if (input.scope === "startingResourceGroup") {
    const startingResourceGroup = normalizeCompareValue(startingNode?.resourceGroup);

    if (startingResourceGroup.length === 0) {
      return [];
    }

    scoped = scoped.filter(
      (node) => normalizeCompareValue(node.resourceGroup) === startingResourceGroup,
    );
  }

  if (input.scope === "diagramNeighbor") {
    if (startingNode == null) {
      return [];
    }

    const neighborIds = resolveDiagramNeighborNodeIds(input.outline, startingNode.id);

    scoped = scoped.filter((node) => neighborIds.has(node.id));
  }

  return scoped.filter((node) => nodeMatchesUnknownSearchQuery(node, input.searchQuery));
}

export function resolveDefaultDiagramOutlineUnknownNodeFilterScope(
  startingSeedId: string | null | undefined,
): DiagramOutlineUnknownNodeFilterScope {
  const trimmed = startingSeedId?.trim() ?? "";

  if (trimmed.length > 0) {
    return "startingResourceGroup";
  }

  return "all";
}

export function resolveDiagramOutlineUnknownNodeFilterScopeForWorkbench(input: {
  readonly startingSeedId: string | null | undefined;
  readonly dependencyNeighborhoodMode: boolean;
}): DiagramOutlineUnknownNodeFilterScope {
  const trimmed = input.startingSeedId?.trim() ?? "";

  if (trimmed.length === 0) {
    return "all";
  }

  if (input.dependencyNeighborhoodMode) {
    return "diagramNeighbor";
  }

  return "startingResourceGroup";
}
