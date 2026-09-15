import { countDiagramOutlineComponents } from "@/lib/infra-evidence/diagram-outline-connected-components";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function buildDiagramWalkthrough(outline: InfraEvidenceMermaidOutline): string {
  const nodeCount = outline.nodes.length;
  const edgeCount = outline.edges.length;
  const componentCount = countDiagramOutlineComponents(outline, { includeTrivial: true });

  const componentLabel = componentCount === 1 ? "component" : "components";

  return `${nodeCount} resources in ${componentCount} connected ${componentLabel}. ${edgeCount} visible relationships.`;
}
