/** UI types for IE-UX-01 drift workbench (mirrors infra-evidence snapshot/diff API). */

export type InfraEvidencePagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type InfraEvidenceSnapshotSummary = {
  snapshotId: string;
  subscriptionId: string | null;
  subscriptionName: string | null;
  capturedUtc: string | null;
  captureStatus: number;
  resourceCount: number;
  relationshipCount: number;
};

export type InfraEvidenceDiffSummary = {
  diffId: string;
  snapshotAId: string;
  snapshotBId: string;
  subscriptionId: string | null;
  totalChanges: number;
  resourceAddedCount: number;
  resourceRemovedCount: number;
  resourceModifiedCount: number;
  createdUtc: string;
};

export type InfraEvidenceDiffChange = {
  changeId: string;
  diffId: string;
  cloudResourceId: string | null;
  azureResourceId: string | null;
  changeType: number;
  property: string | null;
  oldValue: string | null;
  newValue: string | null;
  riskClassification: string | null;
  evidenceReference: string | null;
};

export type InfraEvidenceBaselineRecord = {
  snapshotId: string;
  baselineKind: string;
  designatedBy: string;
  designatedUtc: string;
};
