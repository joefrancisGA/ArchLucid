import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";

export function InfraEvidenceDiagramOutlineNodeLabel(props: {
  readonly node: InfraEvidenceMermaidOutlineNode;
}): React.JSX.Element {
  return <>{resolveInfraEvidenceDiagramOutlineResourceName(props.node)}</>;
}
