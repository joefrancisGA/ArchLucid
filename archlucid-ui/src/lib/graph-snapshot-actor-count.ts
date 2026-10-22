const ACTOR_NODE_TYPE = "actor";

/**
 * Counts graph snapshot nodes whose `nodeType` is Actor (case-insensitive).
 * Used for honest UX when actor-dependent engines stay silent on IaC-only reviews.
 */
export function countActorNodesInGraphSnapshot(graphSnapshot: unknown): number {
  if (graphSnapshot === null || typeof graphSnapshot !== "object") {
    return 0;
  }

  const nodes = (graphSnapshot as { nodes?: unknown }).nodes;

  if (!Array.isArray(nodes)) {
    return 0;
  }

  let count = 0;

  for (const node of nodes) {
    if (node === null || typeof node !== "object") {
      continue;
    }

    const nodeType = (node as { nodeType?: string }).nodeType;

    if (typeof nodeType === "string" && nodeType.trim().toLowerCase() === ACTOR_NODE_TYPE) {
      count++;
    }
  }

  return count;
}
