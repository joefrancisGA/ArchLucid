export type AuditEvaluationOutcome = "InsufficientEvidence" | "TechnicallySupported" | "TechnicallyNotSupported";

export type AuditEvidenceLineageEvaluationNode = {
  evaluationId?: string;
  outcome?: AuditEvaluationOutcome;
  formula?: string;
  exceptionIds?: string[];
  provenanceKind?: string;
};

export type AuditEvidenceLineageEvidenceNode = {
  evidenceRowId?: string;
  evaluationEvidenceItemId?: string | null;
  cloudResourceId?: string | null;
  azureResourceId?: string | null;
  normalizedPointer?: string | null;
  rawPointer?: string | null;
  apiQueryId?: string | null;
  collectedUtc?: string;
  collectorVersion?: string;
  selectorVersion?: string;
  linkComplete?: boolean;
  itemHashVerified?: boolean;
  missingLinkKinds?: string[];
};

export type AuditEvidenceLineageRequirementChain = {
  requirementId?: string;
  requirementName?: string;
  evidenceType?: string;
  evidence?: AuditEvidenceLineageEvidenceNode[];
};

export type AuditEvidenceLineageRecord = {
  assessmentId?: string;
  auditEvidenceSnapshotId?: string;
  controlId?: string;
  controlNumber?: string;
  controlTitle?: string;
  chainComplete?: boolean;
  snapshotHashVerified?: boolean;
  readyForPositiveCheckbox?: boolean;
  brokenLinkReasons?: string[];
  evaluation?: AuditEvidenceLineageEvaluationNode | null;
  requirementChains?: AuditEvidenceLineageRequirementChain[];
};
