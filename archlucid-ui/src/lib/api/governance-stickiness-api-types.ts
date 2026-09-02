import { ApiV1Routes } from "@/lib/api-v1-routes";

export type FindingDispositionKind =
  | "Accepted"
  | "Deferred"
  | "NeedsEvidence"
  | "Remediated"
  | "RejectedAsNotApplicable";

export type ArchitectureRiskRegisterEntry = {
  findingId: string;
  runId?: string | null;
  manifestId?: string | null;
  title: string;
  severity: string;
  category: string;
  statusLabel: string;
  ownerUserId?: string | null;
  assignedToUserId?: string | null;
  latestDisposition?: FindingDispositionKind | null;
  revisitDueUtc?: string | null;
  remediationDueUtc?: string | null;
  lastReviewedUtc?: string | null;
  agingDays: number;
  waiverExpiresAtUtc?: string | null;
  isStale: boolean;
  evidenceHref: string;
  humanReviewStatus?: number | null;
  itsmLinkedTicketsSummary?: string | null;
  systemName?: string | null;
  resourceId?: string | null;
};

export type ArchitectureRiskRegisterResponse = {
  entries: ArchitectureRiskRegisterEntry[];
};

export type ArchitectureDecisionRegisterEntry = {
  decisionId: string;
  manifestId: string;
  runId: string;
  category: string;
  title: string;
  selectedOption: string;
  rationale: string;
  confidence?: number | null;
  confidenceSource?: string | null;
  buyerConfidenceSource?: string | null;
  recordedAtUtc: string;
  supportingFindingIds: string[];
};

export type ArchitectureDecisionRegisterResponse = {
  decisions: ArchitectureDecisionRegisterEntry[];
};

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

export type PillarExaminationState =
  | "Examined"
  | "PartiallyExamined"
  | "NotExamined"
  | "Unavailable";

export type PillarFindingAggregate = {
  pillarKey: string;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  dispositionedCount: number;
  mutedCount: number;
};

export type ExaminationStateResolution = {
  state: PillarExaminationState;
  reasonText: string;
};

export type PillarPackAssignment = {
  pillarKey: string;
  policyPackId: string;
  policyPackName: string;
  policyPackVersion: string;
  scopeLevel: string;
  isEnabled: boolean;
  assignedUtc: string;
};

export type PillarPosture = {
  pillarKey: string;
  displayName: string;
  displayOrder: number;
  findingCounts: PillarFindingAggregate;
  examination: ExaminationStateResolution;
  packAssignments: PillarPackAssignment[];
};

export type ReviewIntegrityAggregate = {
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  dispositionedCount: number;
  mutedCount: number;
};

export type ArchitecturePostureSummary = {
  pillars: PillarPosture[];
  reviewIntegrity: ReviewIntegrityAggregate;
  uncategorizedCount: number;
  primaryPillarKey: string | null;
  latestSnapshotCreatedUtc: string | null;
  isDegraded: boolean;
};

export type ArchitectureReviewRecurrenceSchedule = {
  scheduleId: string;
  sourceRunId: string;
  name: string;
  cronExpression: string;
  isEnabled: boolean;
  nextRunUtc?: string | null;
  lastTriggeredUtc?: string | null;
  lastTriggeredRunId?: string | null;
  lastRunStatus?: string | null;
  lastErrorMessage?: string | null;
  consecutiveFailureCount?: number;
};

export type GovernanceReviewAwaitingActionItem = {
  runId: string;
  name: string;
  executedUtc?: string | null;
  sourceRunId: string;
  newFindingCount: number;
};

export type GovernanceReviewsAwaitingActionResponse = {
  items: GovernanceReviewAwaitingActionItem[];
};

export type GovernanceAssignedToMeFindingsCountResponse = {
  count: number;
};

export type RealizedValueSummary = {
  findingsRemediatedCount30Days: number;
  medianTimeToRemediationDays?: number | null;
  activeWaiversCount: number;
  waiversRetiredCount30Days: number;
  waiverExpiryReversionCount30Days: number;
  attestedIncidentsAvoided?: number | null;
  attestedRevenueOrRetentionImpact?: string | null;
  attestedReviewerTimeSavedNote?: string | null;
};

export type UpsertRealizedValueAttestationRequest = {
  attestedIncidentsAvoided?: number | null;
  attestedRevenueOrRetentionImpact?: string | null;
  attestedReviewerTimeSavedNote?: string | null;
};

export type ArchitectureDecisionRegisterFilters = {
  category?: string;
  recordedAfterUtc?: string;
  recordedBeforeUtc?: string;
  minConfidence?: number;
  maxConfidence?: number;
  buyerConfidenceSource?: string;
};

export type RecordBulkFindingDispositionResponse = {
  processedCount: number;
  updatedFindingIds: string[];
};

export type PreviewRecurrenceScheduleRunsResponse = {
  isValid: boolean;
  validationError?: string | null;
  nextRunUtc: string[];
};

export const governanceStickinessBase = (): string => `/${ApiV1Routes.governance}`;

export type ArchitectureRiskRegisterQueryOptions = {
  projectId?: string;
  assignedToMe?: boolean;
  maxRows?: number;
};
