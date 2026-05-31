import { apiGet, apiPostJson, apiPostNoContent, apiPutNoContent } from "@/lib/api-client";
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
  latestDisposition?: FindingDispositionKind | null;
  revisitDueUtc?: string | null;
  lastReviewedUtc?: string | null;
  agingDays: number;
  waiverExpiresAtUtc?: string | null;
  isStale: boolean;
  evidenceHref: string;
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

export type ArchitectureReviewRecurrenceSchedule = {
  scheduleId: string;
  sourceRunId: string;
  name: string;
  cronExpression: string;
  isEnabled: boolean;
  nextRunUtc?: string | null;
  lastTriggeredUtc?: string | null;
  lastTriggeredRunId?: string | null;
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

export async function getArchitectureRiskRegister(projectId?: string): Promise<ArchitectureRiskRegisterResponse> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<ArchitectureRiskRegisterResponse>(`${governanceBase()}/risk-register${suffix}`);
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

export async function recordFindingDisposition(
  findingId: string,
  body: {
    disposition: FindingDispositionKind;
    rationale?: string;
    runId?: string;
    revisitDueUtc?: string;
    evidenceRequestText?: string;
  },
): Promise<FindingDispositionEvent> {
  return apiPostJson<FindingDispositionEvent>(
    `${governanceBase()}/findings/${encodeURIComponent(findingId)}/dispositions`,
    body,
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

export async function getGovernanceDecisionsNeededSummary(
  projectId?: string,
): Promise<GovernanceDecisionsNeededSummary> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<GovernanceDecisionsNeededSummary>(`${governanceBase()}/decisions-needed-summary${suffix}`);
}

export async function createArchitectureReviewRecurrenceSchedule(body: {
  sourceRunId: string;
  name?: string;
  cronExpression?: string;
  isEnabled?: boolean;
}): Promise<ArchitectureReviewRecurrenceSchedule> {
  return apiPostJson<ArchitectureReviewRecurrenceSchedule>(`${governanceBase()}/recurrence-schedules`, body);
}

export async function listArchitectureReviewRecurrenceSchedules(): Promise<ArchitectureReviewRecurrenceSchedule[]> {
  return apiGet<ArchitectureReviewRecurrenceSchedule[]>(`${governanceBase()}/recurrence-schedules`);
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
