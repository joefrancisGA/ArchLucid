export type RemediationPatternRecord = {
  patternId: string;
  patternKey: string;
  displayName: string;
  description?: string | null;
  currentApprovedVersion?: string | null;
  createdByActorKey: string;
  createdUtc: string;
  updatedUtc: string;
};

export type RemediationPatternVersionRecord = {
  versionId: string;
  patternId: string;
  version: string;
  status?: number;
  controlObjective: string;
  authorActorKey: string;
  approvedByActorKey?: string | null;
  approvedUtc?: string | null;
  automationLevel?: number;
  createdUtc: string;
  updatedUtc: string;
};

export type RemediationPatternDetailResult = {
  succeeded: boolean;
  pattern?: RemediationPatternRecord | null;
  versions?: RemediationPatternVersionRecord[];
  errorMessage?: string | null;
};

export type RemediationPatternOperationResult = {
  succeeded: boolean;
  patternId?: string | null;
  version?: string | null;
  status?: number | null;
  errorMessage?: string | null;
};

export type RemediationPatternImportResult = {
  succeeded: boolean;
  patternId?: string | null;
  version?: string | null;
  errorMessage?: string | null;
};
