export type FindingDispositionKind =
  | "Accepted"
  | "Deferred"
  | "NeedsEvidence"
  | "Remediated"
  | "RejectedAsNotApplicable";

export type RiskExceptionRecord = {
  riskExceptionId: string;
  findingId: string;
  ownerUserId: string;
  rationale: string;
  expiresAtUtc: string;
  status: string;
  runId?: string | null;
  manifestId?: string | null;
  evidenceRef?: string | null;
};

export type FindingDispositionEvent = {
  eventId: string;
  findingId: string;
  disposition: FindingDispositionKind;
  reviewerUserId: string;
  rationale?: string | null;
  revisitDueUtc?: string | null;
  evidenceRequestText?: string | null;
  occurredAtUtc: string;
  runId?: string | null;
  currentDispositionRowVersionBase64?: string | null;
};

export type GovernanceDecisionsNeededSummary = {
  pendingApprovals: number;
  staleRisks: number;
  unownedHighSeverityRisks: number;
  findingsAwaitingEvidence: number;
  waiversExpiringWithin14Days: number;
  deferredFindingsDue: number;
  totalDecisionItems: number;
};

export type RecordBulkFindingDispositionResponse = {
  processedCount: number;
  updatedFindingIds: string[];
};
