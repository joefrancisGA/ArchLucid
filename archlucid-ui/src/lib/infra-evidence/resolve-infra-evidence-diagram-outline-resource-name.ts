import {
  isSecureNowResourceDisplayNameMissing,
  normalizeSecureNowResourceNameForDisplay,
  SECURE_NOW_RESOURCE_NAME_NOT_STORED_LABEL,
} from "@/lib/infra-evidence/format-azure-resource-display";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export function resolveInfraEvidenceDiagramOutlineResourceName(
  node: InfraEvidenceMermaidOutlineNode,
): string {
  const label = node.label.split(" · ", 1)[0]?.trim() ?? "";

  if (isSecureNowResourceDisplayNameMissing(label)) {
    return SECURE_NOW_RESOURCE_NAME_NOT_STORED_LABEL;
  }

  // Mermaid labels sometimes already include a trailing "(type)" suffix. Strip it
  // when metadata carries the ARM type so the Nodes type column is the single source.
  if (node.resourceType != null && node.resourceType.trim().length > 0 && /\s\([^)]+\)\s*$/u.test(label)) {
    const stripped = label.replace(/\s\([^)]+\)\s*$/u, "").trim();

    if (stripped.length > 0) {
      const normalized = normalizeSecureNowResourceNameForDisplay(stripped);

      if (isSecureNowResourceDisplayNameMissing(normalized)) {
        return SECURE_NOW_RESOURCE_NAME_NOT_STORED_LABEL;
      }

      return normalized;
    }
  }

  const normalized = normalizeSecureNowResourceNameForDisplay(label);

  if (isSecureNowResourceDisplayNameMissing(normalized)) {
    return SECURE_NOW_RESOURCE_NAME_NOT_STORED_LABEL;
  }

  return normalized;
}
