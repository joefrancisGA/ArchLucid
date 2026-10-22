import type { ArchitectureContentProvenance } from "@/lib/architecture/architecture-structured-content-types";

export type ArchitectureDiagramNodeKind = "user" | "system" | "external" | "boundary";

export type ArchitectureDiagramNode = {
  readonly id: string;
  readonly label: string;
  readonly kind: ArchitectureDiagramNodeKind;
  readonly provenance: ArchitectureContentProvenance;
  readonly removed: boolean;
  readonly accepted: boolean;
};

export type ArchitectureDiagramEdge = {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly label: string;
  readonly provenance: ArchitectureContentProvenance;
  readonly removed: boolean;
};

export type ArchitectureDiagramModel = {
  readonly nodes: readonly ArchitectureDiagramNode[];
  readonly edges: readonly ArchitectureDiagramEdge[];
  readonly trustBoundaryLabels: readonly string[];
};

export type ArchitectureDiagramMissingCategory =
  | "major-components"
  | "external-systems"
  | "users-or-initiators"
  | "integrations"
  | "data-flows"
  | "trust-boundaries";

export type ArchitectureDiagramReadiness = {
  readonly sufficient: boolean;
  readonly missingCategories: readonly ArchitectureDiagramMissingCategory[];
  readonly activeNodeCount: number;
};

export type ArchitectureDiagramVersionSource = "generated" | "user-edit" | "regenerated";

export type ArchitectureDiagramVersion = {
  readonly versionId: string;
  readonly savedAtUtc: string;
  readonly source: ArchitectureDiagramVersionSource;
  readonly mermaidSource: string;
  readonly contentFingerprint: string;
  readonly label: string;
};

export type ArchitectureDiagramCacheRecord = {
  readonly runId: string;
  readonly contentFingerprint: string;
  readonly activeVersionId: string;
  readonly versions: readonly ArchitectureDiagramVersion[];
  readonly nodeOverrides: readonly ArchitectureDiagramNode[];
  readonly edgeOverrides: readonly ArchitectureDiagramEdge[];
};

export type ArchitectureDiagramGenerationResult = {
  readonly readiness: ArchitectureDiagramReadiness;
  readonly model: ArchitectureDiagramModel | null;
  readonly mermaidSource: string | null;
  readonly textAlternative: string;
  readonly contentFingerprint: string;
};
