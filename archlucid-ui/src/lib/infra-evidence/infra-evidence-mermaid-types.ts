/** UI types for IE-UX-02 inventory Mermaid workbench (mirrors infra-evidence Mermaid API). */

export type InfraEvidenceMermaidComplexityMetrics = {
  nodeCount: number;
  edgeCount: number;
  subgraphCount: number;
  maxDegree: number;
  crossSubgraphEdgeCount: number;
  textSizeBytes: number;
  layoutEstimate: number;
};

export type InfraEvidenceMermaidFallbackArtifactSummary = {
  key: string;
  label: string;
  status: string;
  nodeCount: number;
  edgeCount: number;
};

export type InfraEvidenceMermaidModePreview = {
  mode: string;
  status: string;
  nodeCount: number;
  edgeCount: number;
  mermaid: string | null;
  fallbackArtifacts: InfraEvidenceMermaidFallbackArtifactSummary[];
};

export type InfraEvidenceMermaidPreviewResponse = {
  snapshotId: string;
  modes: InfraEvidenceMermaidModePreview[];
  completenessWarnings?: string[];
};

export type InfraEvidenceMermaidCollapseEntry = {
  kind: string;
  cloudResourceId: string | null;
  nodeId: string | null;
  reason: string;
};

export type InfraEvidenceMermaidCollapseReport = {
  entries: InfraEvidenceMermaidCollapseEntry[];
};

export type InfraEvidenceMermaidIdentityDiagramSuppressedArmType = {
  armResourceType: string;
  resourceCount: number;
};

export type InfraEvidenceMermaidIdentityDiagramHints = {
  inventoryFilteredIdentityArmTypes: InfraEvidenceMermaidIdentityDiagramSuppressedArmType[];
};

export type InfraEvidenceMermaidRenderResponse = {
  snapshotId: string;
  mode: string;
  fallbackKey: string | null;
  status: string;
  mermaid: string | null;
  layoutSvg: string | null;
  layoutEngine: string | null;
  metrics: InfraEvidenceMermaidComplexityMetrics | null;
  fallbackArtifacts: InfraEvidenceMermaidFallbackArtifactSummary[];
  collapseReport: InfraEvidenceMermaidCollapseReport | null;
  identityDiagramHints?: InfraEvidenceMermaidIdentityDiagramHints | null;
  completenessWarnings?: string[];
  completenessSummary?: InfraEvidenceMermaidCompletenessSummary | null;
};

export type InfraEvidenceMermaidCompletenessSummary = {
  mode: string;
  visibleNodeCount: number;
  visibleEdgeCount: number;
  connectedComponentCount: number;
  hiddenHopsUsedCount: number;
  likelyInCollocationEdgeCount: number;
  missingClasses: string[];
  collectedClasses: string[];
};

export type InfraEvidenceMermaidRenderStatus = "Succeeded" | "Partitioned" | "Failed";
