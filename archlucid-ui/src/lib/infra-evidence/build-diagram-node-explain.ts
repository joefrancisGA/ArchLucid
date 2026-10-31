import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

export type DiagramNodeProvenanceClass =
  | "evidence-backed"
  | "inferred"
  | "user-drawn"
  | "not-verifiable";

export const DIAGRAM_NODE_EXPLAIN_SEED_NOT_STORED = "Seed node id was not stored." as const;

export function buildDiagramNodeExplain(
  node: InfraEvidenceMermaidOutlineNode,
  provenanceClass: DiagramNodeProvenanceClass,
): string {
  if (provenanceClass === "not-verifiable") {
    return "Not verifiable from this diagram source.";
  }

  const seedNodeId = node.seedNodeId?.trim() ?? "";

  if (seedNodeId.length === 0) {
    return DIAGRAM_NODE_EXPLAIN_SEED_NOT_STORED;
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
