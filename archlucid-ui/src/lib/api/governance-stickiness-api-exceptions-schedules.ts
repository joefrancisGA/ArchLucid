import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { recurrenceScheduleMutationBlockedReason } from "@/lib/governance/recurrence-schedule-mutation-blocked-reason";
import { riskExceptionMutationBlockedReason } from "@/lib/governance/risk-exception-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import type { components } from "@/lib/openapi-schemas";
import {
  type ArchitectureReviewRecurrenceSchedule,
  type PreviewRecurrenceScheduleRunsResponse,
  type RiskExceptionRecord,
  type UpsertRealizedValueAttestationRequest,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export type RealizedValueAttestationResponse = components["schemas"]["RealizedValueAttestationResponse"];

export async function createRiskException(body: {
  findingId: string;
  ownerUserId: string;
  rationale: string;
  expiresAtUtc: string;
  runId?: string;
  manifestId?: string;
  evidenceRef?: string;
}): Promise<RiskExceptionRecord> {
  try {
    return await apiPostJson<RiskExceptionRecord>(`${governanceStickinessBase()}/risk-exceptions`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function listRiskExceptions(projectId?: string): Promise<RiskExceptionRecord[]> {
  const query = new URLSearchParams();
  if (projectId) query.set("projectId", projectId);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiGetSealedManifestAware<RiskExceptionRecord[]>(
    `${governanceStickinessBase()}/risk-exceptions${suffix}`,
  );
}

export async function revokeRiskException(riskExceptionId: string): Promise<void> {
  try {
    await apiPostNoContent(
      `${governanceStickinessBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/revoke`,
      {},
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function renewRiskException(
  riskExceptionId: string,
  body: { expiresAtUtc: string; rationale?: string; evidenceRef?: string },
): Promise<RiskExceptionRecord> {
  try {
    return await apiPostJson<RiskExceptionRecord>(
      `${governanceStickinessBase()}/risk-exceptions/${encodeURIComponent(riskExceptionId)}/renew`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function createArchitectureReviewRecurrenceSchedule(body: {
  sourceRunId: string;
  name?: string;
  cronExpression?: string;
  isEnabled: boolean;
}): Promise<ArchitectureReviewRecurrenceSchedule> {
  try {
    return await apiPostJson<ArchitectureReviewRecurrenceSchedule>(
      `${governanceStickinessBase()}/recurrence-schedules`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function previewRecurrenceScheduleRuns(body: {
  cronExpression: string;
  count?: number;
  fromUtc?: string;
}): Promise<PreviewRecurrenceScheduleRunsResponse> {
  try {
    return await apiPostJson<PreviewRecurrenceScheduleRunsResponse>(
      `${governanceStickinessBase()}/recurrence-schedules/preview-next-runs`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function listArchitectureReviewRecurrenceSchedules(): Promise<ArchitectureReviewRecurrenceSchedule[]> {
  return apiGetSealedManifestAware<ArchitectureReviewRecurrenceSchedule[]>(
    `${governanceStickinessBase()}/recurrence-schedules`,
  );
}

export async function getRealizedValueAttestation(): Promise<RealizedValueAttestationResponse> {
  return apiGetSealedManifestAware<RealizedValueAttestationResponse>(
    `${governanceStickinessBase()}/realized-value/attestation`,
  );
}

export async function updateArchitectureReviewRecurrenceSchedule(
  scheduleId: string,
  body: {
    isEnabled?: boolean;
    name?: string;
    cronExpression?: string;
  },
): Promise<ArchitectureReviewRecurrenceSchedule> {
  try {
    return await apiPutJson<ArchitectureReviewRecurrenceSchedule>(
      `${governanceStickinessBase()}/recurrence-schedules/${encodeURIComponent(scheduleId)}`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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
