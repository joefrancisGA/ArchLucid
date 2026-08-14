import type { GraphNodeVm, GraphViewModel } from "@/types/graph";

function buildAdjacency(graph: GraphViewModel): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    const sourceNeighbors = adjacency.get(edge.source) ?? [];
    sourceNeighbors.push(edge.target);
    adjacency.set(edge.source, sourceNeighbors);

    const targetNeighbors = adjacency.get(edge.target) ?? [];
    targetNeighbors.push(edge.source);
    adjacency.set(edge.target, targetNeighbors);
  }

  return adjacency;
}

function collectReachable(startId: string, adjacency: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === undefined || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited;
}

/** Nodes on paths between the selected node and the review node, if both exist. */
export function resolveBuyerTrailPathNodeIds(
  graph: GraphViewModel,
  selectedNodeId: string,
): Set<string> | null {
  const trimmed = selectedNodeId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const reviewPackageNode = graph.nodes.find((node) => node.type === "GoldenManifest");

  if (reviewPackageNode === undefined) {
    return null;
  }

  const adjacency = buildAdjacency(graph);
  const fromSelected = collectReachable(trimmed, adjacency);
  const fromReviewPackage = collectReachable(reviewPackageNode.id, adjacency);
  const intersection = new Set<string>();

  for (const nodeId of fromSelected) {
    if (fromReviewPackage.has(nodeId)) {
      intersection.add(nodeId);
    }
  }

  if (intersection.size === 0) {
    return new Set([trimmed, reviewPackageNode.id]);
  }

  return intersection;
}

export function filterGraphViewModelToNodeIds(
  graph: GraphViewModel,
  nodeIds: Set<string>,
): GraphViewModel {
  const nodes = graph.nodes.filter((node) => nodeIds.has(node.id));
  const edges = graph.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return { nodes, edges };
}

export function graphNodeLabelForPanel(node: GraphNodeVm): string {
  const label = node.label.trim();

  if (label.length > 0) {
    return label;
  }

  return node.type;
}

function buyerTrailBreadcrumbLabel(nodeType: string): string {
  switch (nodeType) {
    case "Finding":
      return "Finding";
    case "Decision":
      return "Decision";
    case "GoldenManifest":
      return "Review";
    case "Artifact":
      return "Evidence";
    case "PolicyPack":
    case "Policy":
      return "Policy";
    case "Component":
      return "Component";
    case "Approval":
      return "Approval";
    case "Audit":
    case "AuditEvent":
      return "Audit";
    default:
      return nodeType.trim().length > 0 ? nodeType : "Node";
  }
}

/**
 * Short inspector trail from the selected node toward the sealed review record.
 * Uses BFS so the breadcrumb stays a linear path, not the full path intersection set.
 */
export function resolveBuyerTrailPathBreadcrumb(
  graph: GraphViewModel,
  selectedNodeId: string,
): string[] {
  const trimmed = selectedNodeId.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const selected = graph.nodes.find((node) => node.id === trimmed);

  if (selected === undefined) {
    return [];
  }

  const reviewPackageNode = graph.nodes.find((node) => node.type === "GoldenManifest");

  if (reviewPackageNode === undefined || reviewPackageNode.id === trimmed) {
    return [buyerTrailBreadcrumbLabel(selected.type)];
  }

  const adjacency = buildAdjacency(graph);
  const parent = new Map<string, string | null>();
  const queue: string[] = [trimmed];
  parent.set(trimmed, null);
  let reachedReview = false;

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === undefined) {
      break;
    }

    if (current === reviewPackageNode.id) {
      reachedReview = true;
      break;
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      if (parent.has(neighbor)) {
        continue;
      }

      parent.set(neighbor, current);
      queue.push(neighbor);
    }
  }

  const pathIds: string[] = [];

  if (reachedReview) {
    let cursor: string | null = reviewPackageNode.id;

    while (cursor !== null) {
      pathIds.push(cursor);
      cursor = parent.get(cursor) ?? null;
    }

    pathIds.reverse();
  } else {
    pathIds.push(trimmed, reviewPackageNode.id);
  }

  const labels: string[] = [];

  for (const nodeId of pathIds) {
    const node = graph.nodes.find((candidate) => candidate.id === nodeId);

    if (node === undefined) {
      continue;
    }

    const label = buyerTrailBreadcrumbLabel(node.type);

    if (labels[labels.length - 1] === label) {
      continue;
    }

    labels.push(label);
  }

  return labels;
}
