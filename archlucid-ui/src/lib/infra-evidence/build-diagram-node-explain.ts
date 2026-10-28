import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type DiagramNodeProvenanceClass =
  | "evidence-backed"
  | "inferred"
  | "user-drawn"
  | "not-verifiable";

export function buildDiagramNodeExplain(
  node: InfraEvidenceMermaidOutlineNode,
  provenanceClass: DiagramNodeProvenanceClass,
): string {
  const seedNodeId = node.seedNodeId?.trim() ?? "";

  if (provenanceClass === "not-verifiable" || seedNodeId.length === 0) {
    return "Not verifiable from this diagram source.";
  }

  if (provenanceClass === "inferred") {
    return "Inferred from the brief — confirm or remove.";
  }

  if (provenanceClass === "user-drawn") {
    return "Drawn in the architecture editor.";
  }

  const label = node.label?.trim() ?? "";

  if (label.length > 0) {
    return `Evidence-backed resource ${label}.`;
  }

  return "Resource name was not stored.";
}
