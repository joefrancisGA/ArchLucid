import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function buildDiagramWalkthrough(outline: InfraEvidenceMermaidOutline): string {
  const nodeCount = outline.nodes.length;
  const edgeCount = outline.edges.length;
  const subgraphCount = countConnectedGroups(outline);

  return `${nodeCount} resources in ${subgraphCount} connected groups. ${edgeCount} visible relationships.`;
}

function countConnectedGroups(outline: InfraEvidenceMermaidOutline): number {
  if (outline.nodes.length === 0) {
    return 0;
  }

  const adjacency = new Map<string, Set<string>>();

  for (const node of outline.nodes) {
    adjacency.set(node.id, new Set<string>());
  }

  for (const edge of outline.edges) {
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  }

  const visited = new Set<string>();
  let groups = 0;

  for (const node of outline.nodes) {
    if (visited.has(node.id)) {
      continue;
    }

    groups += 1;
    const stack = [node.id];

    while (stack.length > 0) {
      const current = stack.pop();

      if (current == null || visited.has(current)) {
        continue;
      }

      visited.add(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return groups;
}
