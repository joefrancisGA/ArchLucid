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
  status: string | null;
  nodeCount: number | null;
  edgeCount: number | null;
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
  reason: string | null;
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
  failureReason?: string | null;
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
  visibleNodeCount: number | null;
  visibleEdgeCount: number | null;
  connectedComponentCount: number | null;
  hiddenHopsUsedCount: number | null;
  likelyInCollocationEdgeCount: number | null;
  missingClasses: string[];
  collectedClasses: string[];
};

export type InfraEvidenceMermaidRenderStatus = "Succeeded" | "Partitioned" | "Failed";
