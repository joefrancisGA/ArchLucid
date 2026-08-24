import { apiGet, apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";
import { createGovernanceMutationIdempotencyKey } from "@/lib/governance/governance-mutation-idempotency-key";
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

const governanceBase = (): string => `/${ApiV1Routes.governance}`;

export type ArchitectureRiskRegisterQueryOptions = {
  projectId?: string;
  assignedToMe?: boolean;
  maxRows?: number;
};

export async function getArchitectureRiskRegister(
  options?: ArchitectureRiskRegisterQueryOptions,
): Promise<ArchitectureRiskRegisterResponse> {
  const query = new URLSearchParams();

  if (options?.projectId) {
    query.set("projectId", options.projectId);
  }

  if (options?.assignedToMe) {
    query.set("assignedToMe", "true");
  }

  if (typeof options?.maxRows === "number") {
    query.set("maxRows", String(options.maxRows));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureRiskRegisterResponse>(`${governanceBase()}/risk-register${suffix}`);
}

export async function getGovernanceAssignedToMeFindingsCount(
  projectId?: string,
): Promise<GovernanceAssignedToMeFindingsCountResponse> {
  const query = new URLSearchParams();

  if (projectId) {
    query.set("projectId", projectId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<GovernanceAssignedToMeFindingsCountResponse>(
    `${governanceBase()}/risk-register/assigned-to-me-count${suffix}`,
  );
}

/** Risk and decision registers for the governance findings queue. */
export async function fetchGovernanceFindingsRegistersBundle(options?: {
  projectId?: string;
  maxRows?: number;
}): Promise<{
  riskRegister: ArchitectureRiskRegisterResponse;
  decisionRegister: ArchitectureDecisionRegisterResponse;
}> {
  const query = new URLSearchParams();

  if (options?.projectId) {
    query.set("projectId", options.projectId);
  }

  if (typeof options?.maxRows === "number") {
    query.set("maxRows", String(options.maxRows));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiGet(`${governanceBase()}/findings-registers-bundle${suffix}`);
}

export async function getArchitectureDecisionRegister(
  projectId?: string,
  filters?: ArchitectureDecisionRegisterFilters,
): Promise<ArchitectureDecisionRegisterResponse> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  if (filters?.category) query.set("category", filters.category);
  if (filters?.recordedAfterUtc) query.set("recordedAfterUtc", filters.recordedAfterUtc);
  if (filters?.recordedBeforeUtc) query.set("recordedBeforeUtc", filters.recordedBeforeUtc);
  if (typeof filters?.minConfidence === "number") query.set("minConfidence", String(filters.minConfidence));
  if (typeof filters?.maxConfidence === "number") query.set("maxConfidence", String(filters.maxConfidence));
  if (filters?.buyerConfidenceSource) query.set("buyerConfidenceSource", filters.buyerConfidenceSource);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureDecisionRegisterResponse>(`${governanceBase()}/decision-register${suffix}`);
}

export type RecordBulkFindingDispositionResponse = {
  processedCount: number;
  updatedFindingIds: string[];
};

export async function recordFindingDisposition(
  findingId: string,
  body: {
    disposition: FindingDispositionKind;
    rationale?: string;
    runId: string;
    revisitDueUtc?: string;
    evidenceRequestText?: string;
    tradeOffAcknowledgment?: string;
  },
  options?: { readonly idempotencyKey?: string },
): Promise<FindingDispositionEvent> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  return apiPostJson<FindingDispositionEvent>(
    `${governanceBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
    body,
    { extraHeaders: { "Idempotency-Key": idempotencyKey } },
  );
}

export async function recordBulkFindingDisposition(
  body: {
    findingIds: readonly string[];
    disposition: FindingDispositionKind;
    rationale?: string;
    revisitDueUtc?: string;
  },
  options?: { readonly idempotencyKey?: string },
): Promise<RecordBulkFindingDispositionResponse> {
  const idempotencyKey = options?.idempotencyKey?.trim() || createGovernanceMutationIdempotencyKey();

  return apiPostJson<RecordBulkFindingDispositionResponse>(
    `${governanceBase()}/findings/bulk-disposition`,
    body,
    { extraHeaders: { "Idempotency-Key": idempotencyKey } },
  );
}

export async function listFindingDispositions(findingId: string): Promise<FindingDispositionEvent[]> {
  return apiGet<FindingDispositionEvent[]>(
    `${governanceBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
  );
}

export async function createRiskException(body: {
  findingId: string;
  ownerUserId: string;
  rationale: string;
  expiresAtUtc: string;
  runId?: string;
  manifestId?: string;
  evidenceRef?: string;
}): Promise<RiskExceptionRecord> {
  return apiPostJson<RiskExceptionRecord>(`${governanceBase()}/risk-exceptions`, body);
}

export async function listRiskExceptions(projectId?: string): Promise<RiskExceptionRecord[]> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<RiskExceptionRecord[]>(`${governanceBase()}/risk-exceptions${suffix}`);
}

export async function revokeRiskException(riskExceptionId: string): Promise<void> {
  await apiPostNoContent(`${governanceBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/revoke`, {});
}

export async function renewRiskException(
  riskExceptionId: string,
  body: { expiresAtUtc: string; rationale?: string; evidenceRef?: string },
): Promise<RiskExceptionRecord> {
  return apiPostJson<RiskExceptionRecord>(
    `${governanceBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/renew`,
    body,
  );
}

export async function getGovernanceReviewsAwaitingAction(): Promise<GovernanceReviewsAwaitingActionResponse> {
  return apiGet<GovernanceReviewsAwaitingActionResponse>(`${governanceBase()}/reviews-awaiting-action`);
}

export async function getGovernanceDecisionsNeededSummary(
  projectId?: string,
): Promise<GovernanceDecisionsNeededSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<GovernanceDecisionsNeededSummary>(`${governanceBase()}/decisions-needed-summary${suffix}`);
}

export async function getGovernancePosture(projectId?: string): Promise<ArchitecturePostureSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitecturePostureSummary>(`${governanceBase()}/posture${suffix}`);
}

export async function createArchitectureReviewRecurrenceSchedule(body: {
  sourceRunId: string;
  name?: string;
  cronExpression?: string;
  isEnabled: boolean;
}): Promise<ArchitectureReviewRecurrenceSchedule> {
  return apiPostJson<ArchitectureReviewRecurrenceSchedule>(`${governanceBase()}/recurrence-schedules`, body);
}

export type PreviewRecurrenceScheduleRunsResponse = {
  isValid: boolean;
  validationError?: string | null;
  nextRunUtc: string[];
};

export async function previewRecurrenceScheduleRuns(body: {
  cronExpression: string;
  count?: number;
  fromUtc?: string;
}): Promise<PreviewRecurrenceScheduleRunsResponse> {
  return apiPostJson<PreviewRecurrenceScheduleRunsResponse>(
    `${governanceBase()}/recurrence-schedules/preview-next-runs`,
    body,
  );
}

export async function listArchitectureReviewRecurrenceSchedules(): Promise<ArchitectureReviewRecurrenceSchedule[]> {
  return apiGet<ArchitectureReviewRecurrenceSchedule[]>(`${governanceBase()}/recurrence-schedules`);
}

export async function updateArchitectureReviewRecurrenceSchedule(
  scheduleId: string,
  body: {
    isEnabled?: boolean;
    name?: string;
    cronExpression?: string;
  },
): Promise<ArchitectureReviewRecurrenceSchedule> {
  return apiPutJson<ArchitectureReviewRecurrenceSchedule>(
    `${governanceBase()}/recurrence-schedules/${encodeURIComponent(scheduleId)}`,
    body,
  );
}

export async function upsertRealizedValueAttestation(body: UpsertRealizedValueAttestationRequest): Promise<void> {
  await apiPutNoContent(`${governanceBase()}/realized-value/attestation`, body);
}

/** Default waiver duration (90 days) used when the operator does not pick a custom expiry. */
export function defaultRiskExceptionExpiresAtUtc(): string {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 90);
  return expires.toISOString();
}
