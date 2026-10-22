import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type DiagramOutlineConnectedComponent = {
  readonly nodeIds: readonly string[];
};

export type DiagramOutlineComponentPartition = {
  readonly significant: readonly DiagramOutlineConnectedComponent[];
  readonly trivial: readonly DiagramOutlineConnectedComponent[];
};

/** Singleton isolates in a multi-component forest are always excluded from component totals. */
export function isTrivialDiagramOutlineComponent(
  component: DiagramOutlineConnectedComponent,
  allComponents: readonly DiagramOutlineConnectedComponent[],
): boolean {
  if (component.nodeIds.length !== 1) {
    return false;
  }

  return allComponents.length > 1;
}

export function buildDiagramOutlineConnectedComponents(
  outline: InfraEvidenceMermaidOutline,
): DiagramOutlineConnectedComponent[] {
  if (outline.nodes.length === 0) {
    return [];
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
  const components: DiagramOutlineConnectedComponent[] = [];

  for (const node of outline.nodes) {
    if (visited.has(node.id)) {
      continue;
    }

    const nodeIds: string[] = [];
    const stack = [node.id];

    while (stack.length > 0) {
      const current = stack.pop();

      if (current == null || visited.has(current)) {
        continue;
      }

      visited.add(current);
      nodeIds.push(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    components.push({ nodeIds });
  }

  return components;
}

export function partitionDiagramOutlineComponents(
  outline: InfraEvidenceMermaidOutline,
): DiagramOutlineComponentPartition {
  const components = buildDiagramOutlineConnectedComponents(outline);
  const significant: DiagramOutlineConnectedComponent[] = [];
  const trivial: DiagramOutlineConnectedComponent[] = [];

  for (const component of components) {
    if (isTrivialDiagramOutlineComponent(component, components)) {
      trivial.push(component);
      continue;
    }

    significant.push(component);
  }

  return { significant, trivial };
}

export function countDiagramOutlineComponents(
  outline: InfraEvidenceMermaidOutline,
  options?: { readonly includeTrivial?: boolean },
): number {
  const partition = partitionDiagramOutlineComponents(outline);

  if (options?.includeTrivial === true) {
    return partition.significant.length + partition.trivial.length;
  }

  return partition.significant.length;
}

export function resolveTrivialDiagramOutlineNodeIds(outline: InfraEvidenceMermaidOutline): Set<string> {
  const partition = partitionDiagramOutlineComponents(outline);
  const nodeIds = new Set<string>();

  for (const component of partition.trivial) {
    for (const nodeId of component.nodeIds) {
      nodeIds.add(nodeId);
    }
  }

  return nodeIds;
}

export function filterDiagramOutlineForTrivialComponents(
  outline: InfraEvidenceMermaidOutline,
  options: { readonly showTrivialComponents: boolean },
): InfraEvidenceMermaidOutline {
  if (options.showTrivialComponents) {
    return outline;
  }

  const hiddenNodeIds = resolveTrivialDiagramOutlineNodeIds(outline);

  if (hiddenNodeIds.size === 0) {
    return outline;
  }

  return {
    nodes: outline.nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    edges: outline.edges.filter(
      (edge) => !hiddenNodeIds.has(edge.from) && !hiddenNodeIds.has(edge.to),
    ),
  };
}
