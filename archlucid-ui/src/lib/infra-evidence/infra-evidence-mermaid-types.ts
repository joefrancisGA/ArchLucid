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
};

export type InfraEvidenceMermaidRenderResponse = {
  snapshotId: string;
  mode: string;
  fallbackKey: string | null;
  status: string;
  mermaid: string | null;
  metrics: InfraEvidenceMermaidComplexityMetrics | null;
  fallbackArtifacts: InfraEvidenceMermaidFallbackArtifactSummary[];
};

export type InfraEvidenceMermaidRenderStatus = "Succeeded" | "Partitioned" | "Failed";
