import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { cn } from "@/lib/utils";

function resolveInfraEvidenceDiagramOutlineResourceName(node: InfraEvidenceMermaidOutlineNode): string {
  const label = node.label.trim();

  if (label.length === 0) {
    return node.id;
  }

  if (node.resourceType != null && node.resourceType.trim().length > 0 && /\s\([^)]+\)\s*$/u.test(label)) {
    const stripped = label.replace(/\s\([^)]+\)\s*$/u, "").trim();

    if (stripped.length > 0) {
      return stripped;
    }
  }

  return label;
}

export function InfraEvidenceDiagramOutlineNodeLabel(props: {
  readonly node: InfraEvidenceMermaidOutlineNode;
}): React.JSX.Element {
  const resourceName = resolveInfraEvidenceDiagramOutlineResourceName(props.node);
  const typeCaption = formatDiagramArmTypeFriendlyName(props.node.resourceType);

  return (
    <div className="flex flex-col gap-0.5">
      <span>{resourceName}</span>
      {typeCaption != null ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>({typeCaption})</span>
      ) : null}
    </div>
  );
}
