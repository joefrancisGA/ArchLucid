/** UI types for IE-UX-04 resource explorer and evidence hub. */

import type { InfraEvidencePagedResponse } from "@/lib/infra-evidence/infra-evidence-drift-types";

export type CloudResourceSummary = {
  cloudResourceId: string;
  externalResourceId: string;
  displayName: string | null;
  resourceType: string | null;
  resourceGroup: string | null;
  region: string | null;
  lastSeenUtc: string;
};

export type CloudResourceExplorerPage = InfraEvidencePagedResponse<CloudResourceSummary>;

export type CloudResourceAuditLineageMatch = {
  assessmentId: string;
  auditEvidenceSnapshotId: string;
  controlId: string;
  controlNumber: string;
  controlTitle: string;
  snapshotCreatedUtc: string;
};

export type CloudResourceAuditLineageLink = {
  available: boolean;
  degradedReason: string | null;
  relativePath: string | null;
  assessmentId: string | null;
  auditEvidenceSnapshotId: string | null;
  controlId: string | null;
  controlNumber: string | null;
  controlTitle: string | null;
  matches: CloudResourceAuditLineageMatch[];
};

export type CloudResourceCurrentConfigurationSection = {
  snapshotId: string;
  azureResourceId: string;
  resourceType: string;
  resourceGroup: string | null;
  region: string | null;
  properties: Record<string, string>;
  tags: Record<string, string>;
};

export type CloudResourceEvidenceFindingHubItem = {
  id: string;
  title: string;
  severity: string | null;
  status: string | null;
  streamKind: string;
  streamLabel: string;
};

export type CloudResourceEvidenceFindingStreamPage = {
  streamKind: string;
  streamLabel: string;
  items: CloudResourceEvidenceFindingHubItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CloudResourceRemediationHubItem = {
  instanceId: string;
  patternKey: string;
  status: string;
};

export type CloudResourceRemediationStreamPage = {
  items: CloudResourceRemediationHubItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CloudResourceInventoryChangeSummary = {
  changeId: string;
  diffId: string;
  snapshotAId: string;
  snapshotBId: string;
  changeType: string;
  property: string | null;
  oldValue: string | null;
  newValue: string | null;
  riskClassification: string | null;
};

export type CloudResourceNetworkRelationshipSummary = {
  relationshipType: string;
  fromAzureResourceId: string;
  toAzureResourceId: string;
};

export type CloudResourceRbacAssignmentSummary = {
  principalId: string;
  roleDefinitionId: string;
  scope: string;
};

export type CloudResourceEvidencePointer = {
  kind: string;
  relativePath: string;
};

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

export type CloudResourceEvidenceHubResponse = {
  cloudResourceId: string;
  externalResourceId: string;
  resourceType: string | null;
  currentConfiguration: CloudResourceCurrentConfigurationSection | null;
  terraformAddress: string | null;
  terraformGenerationMethod: string | null;
  diagramCorrespondence: DiagramInfrastructureCorrespondenceRow | null;
  operationalSecurityFindings: CloudResourceEvidenceFindingStreamPage;
  architectureReviewFindings: CloudResourceEvidenceFindingStreamPage;
  remediationInstances: CloudResourceRemediationStreamPage;
  rbacAssignments: CloudResourceRbacAssignmentSummary[];
  networkRelationships: CloudResourceNetworkRelationshipSummary[];
  recentChanges: CloudResourceInventoryChangeSummary[];
  auditLineageLink: CloudResourceAuditLineageLink;
  evidencePointers: CloudResourceEvidencePointer[];
};

export type ResourceHubTab =
  | "overview"
  | "drift"
  | "diagram"
  | "terraform"
  | "findings"
  | "remediation"
  | "audit";

export type ResourceHubQueryContext = {
  runId: string;
  snapshotId: string;
  assessmentId: string;
  auditEvidenceSnapshotId: string;
  controlId: string;
};
