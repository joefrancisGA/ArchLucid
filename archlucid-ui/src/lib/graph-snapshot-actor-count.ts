const ACTOR_NODE_TYPE = "actor";

export const ACTOR_NODE_COUNT_NOT_STORED_LABEL = "Actor node count was not stored." as const;

/**
 * Counts graph snapshot nodes whose `nodeType` is Actor (case-insensitive).
 * Returns null when the snapshot or its `nodes` array was not stored.
 */
export function countActorNodesInGraphSnapshot(graphSnapshot: unknown): number | null {
  if (graphSnapshot === null || graphSnapshot === undefined) {
    return null;
  }

  if (typeof graphSnapshot !== "object") {
    return null;
  }

  const nodes = (graphSnapshot as { nodes?: unknown }).nodes;

  if (!Array.isArray(nodes)) {
    return null;
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
