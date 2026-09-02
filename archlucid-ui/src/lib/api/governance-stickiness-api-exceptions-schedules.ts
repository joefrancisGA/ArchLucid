import { apiGet, apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";
import {
  type ArchitectureReviewRecurrenceSchedule,
  type PreviewRecurrenceScheduleRunsResponse,
  type RiskExceptionRecord,
  type UpsertRealizedValueAttestationRequest,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export async function createRiskException(body: {
  findingId: string;
  ownerUserId: string;
  rationale: string;
  expiresAtUtc: string;
  runId?: string;
  manifestId?: string;
  evidenceRef?: string;
}): Promise<RiskExceptionRecord> {
  return apiPostJson<RiskExceptionRecord>(`${governanceStickinessBase()}/risk-exceptions`, body);
}

export async function listRiskExceptions(projectId?: string): Promise<RiskExceptionRecord[]> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGet<RiskExceptionRecord[]>(`${governanceStickinessBase()}/risk-exceptions${suffix}`);
}

export async function revokeRiskException(riskExceptionId: string): Promise<void> {
  await apiPostNoContent(`${governanceStickinessBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/revoke`, {});
}

export async function renewRiskException(
  riskExceptionId: string,
  body: { expiresAtUtc: string; rationale?: string; evidenceRef?: string },
): Promise<RiskExceptionRecord> {
  return apiPostJson<RiskExceptionRecord>(
    `${governanceStickinessBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/renew`,
    body,
  );
}

export async function createArchitectureReviewRecurrenceSchedule(body: {
  sourceRunId: string;
  name?: string;
  cronExpression?: string;
  isEnabled: boolean;
}): Promise<ArchitectureReviewRecurrenceSchedule> {
  return apiPostJson<ArchitectureReviewRecurrenceSchedule>(`${governanceStickinessBase()}/recurrence-schedules`, body);
}

export async function previewRecurrenceScheduleRuns(body: {
  cronExpression: string;
  count?: number;
  fromUtc?: string;
}): Promise<PreviewRecurrenceScheduleRunsResponse> {
  return apiPostJson<PreviewRecurrenceScheduleRunsResponse>(
    `${governanceStickinessBase()}/recurrence-schedules/preview-next-runs`,
    body,
  );
}

export async function listArchitectureReviewRecurrenceSchedules(): Promise<ArchitectureReviewRecurrenceSchedule[]> {
  return apiGet<ArchitectureReviewRecurrenceSchedule[]>(`${governanceStickinessBase()}/recurrence-schedules`);
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
    `${governanceStickinessBase()}/recurrence-schedules/${encodeURIComponent(scheduleId)}`,
    body,
  );
}

export async function upsertRealizedValueAttestation(body: UpsertRealizedValueAttestationRequest): Promise<void> {
  await apiPutNoContent(`${governanceStickinessBase()}/realized-value/attestation`, body);
}

/** Default waiver duration (90 days) used when the operator does not pick a custom expiry. */
export function defaultRiskExceptionExpiresAtUtc(): string {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 90);
  return expires.toISOString();
}
