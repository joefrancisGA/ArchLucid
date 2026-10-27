import { normalizeInfraEvidenceMermaidSourceForDisplay } from "@/lib/infra-evidence/normalize-infra-evidence-mermaid-display";
import {
  parseInfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutline,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { stripExecutiveOverflowNodesFromInfraEvidenceMermaid } from "@/lib/infra-evidence/strip-infra-evidence-executive-overflow-from-mermaid";

/** Parses executive mermaid for dependency-neighborhood seed pickers using display parity with the workbench canvas. */
export function resolveInfraEvidenceSeedCatalogOutlineFromExecutiveMermaid(
  executiveMermaid: string,
): InfraEvidenceMermaidOutline | null {
  const displaySource = normalizeInfraEvidenceMermaidSourceForDisplay(
    stripExecutiveOverflowNodesFromInfraEvidenceMermaid(executiveMermaid),
  );

  if (displaySource.trim().length === 0) {
    return null;
  }

  return parseInfraEvidenceMermaidOutline(displaySource);
}
