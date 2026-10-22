import type { InfraEvidenceMermaidCollapseEntry, InfraEvidenceMermaidCollapseReport } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

export const INFRA_EVIDENCE_MERMAID_ALWAYS_DISPOSE_COLLAPSE_KIND = "AlwaysDisposeArmType";

export function resolveAlwaysExcludedMermaidCollapseEntries(
  collapseReport: InfraEvidenceMermaidCollapseReport | null | undefined,
): InfraEvidenceMermaidCollapseEntry[] {
  if (collapseReport == null) {
    return [];
  }

  return collapseReport.entries.filter(
    (entry) => entry.kind === INFRA_EVIDENCE_MERMAID_ALWAYS_DISPOSE_COLLAPSE_KIND,
  );
}
