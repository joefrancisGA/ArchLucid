/** UI types for IE-UX-03 diagram ↔ inventory reconciliation workbench. */

export const DIAGRAM_INFRASTRUCTURE_MATCH_KINDS = {
  exact: "Exact",
  probable: "Probable",
  possible: "Possible",
  diagramOnly: "DiagramOnly",
  infrastructureOnly: "InfrastructureOnly",
  conflict: "Conflict",
  unknown: "Unknown",
} as const;

export type DiagramInfrastructureMatchKind =
  (typeof DIAGRAM_INFRASTRUCTURE_MATCH_KINDS)[keyof typeof DIAGRAM_INFRASTRUCTURE_MATCH_KINDS];

export const DIAGRAM_INFRASTRUCTURE_CONFIDENCE_BANDS = {
  confirmed: "Confirmed",
  likely: "Likely",
  possible: "Possible",
  insufficientEvidence: "InsufficientEvidence",
} as const;

export type DiagramInfrastructureConfidenceBand =
  (typeof DIAGRAM_INFRASTRUCTURE_CONFIDENCE_BANDS)[keyof typeof DIAGRAM_INFRASTRUCTURE_CONFIDENCE_BANDS];

export type DiagramInfrastructureCorrespondenceRow = {
  correspondenceId: string;
  diagramNodeId: string | null;
  diagramNodeLabel: string | null;
  cloudResourceId: string | null;
  azureResourceId: string | null;
  resourceType: string | null;
  resourceGroup: string | null;
  terraformAddress: string | null;
  matchKind: string;
  confidenceBand: string;
  explainText: string;
  aiRationale: string | null;
  securityDiscrepancy: boolean;
};

export type DiagramInfrastructureReconciliationResult = {
  runId: string;
  snapshotId: string;
  rows: DiagramInfrastructureCorrespondenceRow[];
  diagramNodeCount: number;
  inventoryResourceCount: number;
};

export type StructuredDiagramIngestRequest = {
  sources: DiagramSourceReference[];
};

export type DiagramSourceReference = {
  name: string;
  format: string;
  content: string;
};

export type StructuredDiagramIngestResult = {
  extractionMethod: string | null;
  warnings: string[];
  sourceFingerprints: string[];
  model?: ArchitectureDiagramModelRecord | null;
};

export type ArchitectureDiagramModelRecord = {
  nodes: ArchitectureDiagramNodeRecord[];
  edges: ArchitectureDiagramEdgeRecord[];
};

export type ArchitectureDiagramNodeRecord = {
  id: string;
  label: string;
  removed?: boolean;
};

export type ArchitectureDiagramEdgeRecord = {
  fromNodeId: string;
  toNodeId: string;
  label?: string | null;
};

export type OperationalSecurityFindingIngestRequest = {
  items: OperationalSecurityFindingIngestRequestItem[];
};

export type OperationalSecurityFindingIngestRequestItem = {
  provider: number;
  sourceSystem: string;
  sourceFindingId: string;
  cloudResourceId?: string | null;
  externalResourceId?: string | null;
  resourceType?: string | null;
  title: string;
  description?: string | null;
  severity?: string | null;
  status?: string;
  rawEvidenceReference?: string | null;
  metadata?: Record<string, string | null>;
};

export type OperationalSecurityFindingBatchIngestResult = {
  items: OperationalSecurityFindingIngestItemResult[];
};

export type OperationalSecurityFindingIngestItemResult = {
  sourceFindingId: string;
  findingId: string | null;
  outcome: string;
};

export type DiagramReconcileMatchKindFilter =
  | "all"
  | "Conflict"
  | "DiagramOnly"
  | "InfrastructureOnly"
  | "Exact"
  | "Probable";
