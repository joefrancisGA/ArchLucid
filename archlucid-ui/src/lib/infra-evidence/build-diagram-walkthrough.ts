import { countDiagramOutlineComponents } from "@/lib/infra-evidence/diagram-outline-connected-components";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function buildDiagramWalkthrough(outline: InfraEvidenceMermaidOutline): string {
  const nodeCount = outline.nodes.length;
  const edgeCount = outline.edges.length;
  const componentCount = countDiagramOutlineComponents(outline, { includeTrivial: true });

  const componentLabel = componentCount === 1 ? "component" : "components";
  const sourceCounts = [
    { source: "observed", count: outline.edges.filter((edge) => edge.source === "observed").length },
    { source: "declared", count: outline.edges.filter((edge) => edge.source === "declared").length },
    { source: "probable", count: outline.edges.filter((edge) => edge.source === "probable").length },
    { source: "inferred", count: outline.edges.filter((edge) => edge.source === "inferred").length },
  ].filter((entry) => entry.count > 0);
  const relationshipSourceSummary = sourceCounts
    .map((entry) => `${entry.count} ${entry.source}`)
    .join(", ");
  const notObservedSentence = sourceCounts.some((entry) => entry.source !== "observed")
    ? " Relationships that are not observed are not inventory links."
    : "";
  const relationshipSummary = relationshipSourceSummary.length > 0
    ? ` ${edgeCount} relationships (${relationshipSourceSummary}).`
    : ` ${edgeCount} relationships.`;

  return `${nodeCount} resources in ${componentCount} connected ${componentLabel}.${relationshipSummary}${notObservedSentence}`;
}
