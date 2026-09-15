import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";

/**
 * Edges table To-cell text. When From and To share a display name (private
 * endpoint named after its target, or a self-loop), append the To ARM type so
 * the row is not read as the same object connecting to itself.
 */
export function formatInfraEvidenceOutlineEdgeToLabel(input: {
  readonly fromName: string;
  readonly toName: string;
  readonly toResourceType: string | null | undefined;
}): string {
  const fromName = input.fromName.trim();
  const toName = input.toName.trim();

  if (toName.length === 0) {
    return fromName;
  }

  if (!namesMatch(fromName, toName)) {
    return toName;
  }

  const friendlyType = formatDiagramArmTypeFriendlyName(input.toResourceType);

  if (friendlyType == null || friendlyType.trim().length === 0) {
    return toName;
  }

  const suffix = ` (${friendlyType})`;

  if (toName.toLowerCase().endsWith(suffix.toLowerCase())) {
    return toName;
  }

  return `${toName}${suffix}`;
}

export function resolveInfraEvidenceOutlineEdgeToDisplay(input: {
  readonly fromNode: InfraEvidenceMermaidOutlineNode | undefined;
  readonly toNode: InfraEvidenceMermaidOutlineNode | undefined;
  readonly fromFallback: string;
  readonly toFallback: string;
}): string {
  const fromName =
    input.fromNode != null
      ? resolveInfraEvidenceDiagramOutlineResourceName(input.fromNode)
      : input.fromFallback;
  const toName =
    input.toNode != null
      ? resolveInfraEvidenceDiagramOutlineResourceName(input.toNode)
      : input.toFallback;

  return formatInfraEvidenceOutlineEdgeToLabel({
    fromName,
    toName,
    toResourceType: input.toNode?.resourceType,
  });
}

function namesMatch(fromName: string, toName: string): boolean {
  return fromName.localeCompare(toName, undefined, { sensitivity: "base" }) === 0;
}
