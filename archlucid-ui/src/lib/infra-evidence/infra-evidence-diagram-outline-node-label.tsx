import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function resolveInfraEvidenceDiagramOutlineResourceName(node: InfraEvidenceMermaidOutlineNode): string {
  const label = node.label.trim();

  if (label.length === 0) {
    return node.id;
  }

  // Mermaid labels sometimes already include a trailing "(type)" suffix. Strip it
  // when metadata carries the ARM type so the Nodes type column is the single source.
  if (node.resourceType != null && node.resourceType.trim().length > 0 && /\s\([^)]+\)\s*$/u.test(label)) {
    const stripped = label.replace(/\s\([^)]+\)\s*$/u, "").trim();

    if (stripped.length > 0) {
      return normalizeSecureNowResourceNameForDisplay(stripped);
    }
  }

  return normalizeSecureNowResourceNameForDisplay(label);
}

export function InfraEvidenceDiagramOutlineNodeLabel(props: {
  readonly node: InfraEvidenceMermaidOutlineNode;
}): React.JSX.Element {
  return <>{resolveInfraEvidenceDiagramOutlineResourceName(props.node)}</>;
}
