import { apiGet, apiPostJson, apiPostNoContent, apiPutJson, apiPutNoContent } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { recurrenceScheduleMutationBlockedReason } from "@/lib/governance/recurrence-schedule-mutation-blocked-reason";
import { realizedValueAttestationMutationBlockedReason } from "@/lib/governance/realized-value-attestation-mutation-blocked-reason";
import { riskExceptionMutationBlockedReason } from "@/lib/governance/risk-exception-mutation-blocked-reason";
import {
  realizedValueAttestationBlockedReason,
  recurrenceSchedulesBlockedReason,
  riskExceptionsBlockedReason,
} from "@/lib/governance/governance-stickiness-list-blocked-reason";
import { rethrowLivelihoodMutate401 } from "@/lib/auth/livelihood-mutation-api-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { parseNonNegativeFiniteNumber } from "@/lib/parse-finite-number";

import type { components } from "@/lib/openapi-schemas";

import {
  type ArchitectureReviewRecurrenceSchedule,
  type PreviewRecurrenceScheduleRunsResponse,
  type RiskExceptionRecord,
  type UpsertRealizedValueAttestationRequest,
  governanceStickinessBase,
} from "./governance-stickiness-api-types";

export type RealizedValueAttestationResponse = components["schemas"]["RealizedValueAttestationResponse"];

function trimmedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function encodeRequiredId(value: string, fieldName: string): string {
  return encodeURIComponent(requiredText(value, fieldName));
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : undefined;
}

function readableUtc(value: string, fieldName: string): string {
  const trimmed = requiredText(value, fieldName);

  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${fieldName} was not readable.`);
  }

  return trimmed;
}

function mapRiskException(raw: unknown): RiskExceptionRecord | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const riskExceptionId = trimmedText(row.riskExceptionId);

  if (riskExceptionId.length === 0) {
    return null;
  }

  return {
    riskExceptionId,
    findingId: trimmedText(row.findingId),
    ownerUserId: trimmedText(row.ownerUserId),
    rationale: trimmedText(row.rationale),
    expiresAtUtc: trimmedText(row.expiresAtUtc),
    status: trimmedText(row.status),
    runId: trimmedText(row.runId) || null,
    manifestId: trimmedText(row.manifestId) || null,
    evidenceRef: trimmedText(row.evidenceRef) || null,
  };
}

function mapRiskExceptions(raw: unknown): RiskExceptionRecord[] {
  return Array.isArray(raw)
    ? raw.flatMap((item) => {
        const mapped = mapRiskException(item);

        return mapped === null ? [] : [mapped];
      })
    : [];
}

function mapRecurrenceSchedule(raw: unknown): ArchitectureReviewRecurrenceSchedule | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const scheduleId = trimmedText(row.scheduleId);

  if (scheduleId.length === 0) {
    return null;
  }

  const consecutiveFailureCount = parseNonNegativeFiniteNumber(row.consecutiveFailureCount);

  return {
    scheduleId,
    sourceRunId: trimmedText(row.sourceRunId),
    architectureId: trimmedText(row.architectureId) || null,
    name: trimmedText(row.name),
    cronExpression: trimmedText(row.cronExpression),
    isEnabled: row.isEnabled === true,
    nextRunUtc: trimmedText(row.nextRunUtc) || null,
    lastTriggeredUtc: trimmedText(row.lastTriggeredUtc) || null,
    lastTriggeredRunId: trimmedText(row.lastTriggeredRunId) || null,
    lastRunStatus: trimmedText(row.lastRunStatus) || null,
    lastErrorMessage: trimmedText(row.lastErrorMessage) || null,
    consecutiveFailureCount: consecutiveFailureCount ?? undefined,
  };
}

function mapPreviewResponse(raw: unknown): PreviewRecurrenceScheduleRunsResponse {
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const nextRunUtc = Array.isArray(row.nextRunUtc)
    ? row.nextRunUtc.flatMap((item) => {
        const mapped = trimmedText(item);

        return mapped.length > 0 ? [mapped] : [];
      })
    : [];

  return {
    isValid: row.isValid === true,
    validationError: trimmedText(row.validationError) || null,
    nextRunUtc,
  };
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
  const runId = optionalText(body.runId);
  const manifestId = optionalText(body.manifestId);
  const evidenceRef = optionalText(body.evidenceRef);
  const request = {
    findingId: requiredText(body.findingId, "findingId"),
    ownerUserId: requiredText(body.ownerUserId, "ownerUserId"),
    rationale: requiredText(body.rationale, "rationale"),
    expiresAtUtc: readableUtc(body.expiresAtUtc, "expiresAtUtc"),
    ...(runId !== undefined ? { runId } : {}),
    ...(manifestId !== undefined ? { manifestId } : {}),
    ...(evidenceRef !== undefined ? { evidenceRef } : {}),
  };

  let raw: unknown;

  try {
    raw = await apiPostJson<unknown>(`${governanceStickinessBase()}/risk-exceptions`, request);
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);

    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const mapped = mapRiskException(raw);

  if (mapped === null) {
    throw new Error("Risk exception id was not returned.");
  }

  return mapped;
}

export async function listRiskExceptions(projectId?: string): Promise<RiskExceptionRecord[]> {
  const query = new URLSearchParams();
  const normalizedProjectId = projectId?.trim() ?? "";

  if (normalizedProjectId.length > 0) {
    query.set("projectId", normalizedProjectId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    return mapRiskExceptions(await apiGet<unknown>(`${governanceStickinessBase()}/risk-exceptions${suffix}`));
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionsBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function revokeRiskException(riskExceptionId: string): Promise<void> {
  try {
    await apiPostNoContent(
      `${governanceStickinessBase()}/risk-exceptions/${encodeRequiredId(riskExceptionId, "riskExceptionId")}/revoke`,
      {},
    );
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);

    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function renewRiskException(
  riskExceptionId: string,
  body: { expiresAtUtc: string; rationale?: string; evidenceRef?: string },
): Promise<RiskExceptionRecord> {
  const rationale = optionalText(body.rationale);
  const evidenceRef = optionalText(body.evidenceRef);
  const request = {
    expiresAtUtc: readableUtc(body.expiresAtUtc, "expiresAtUtc"),
    ...(rationale !== undefined ? { rationale } : {}),
    ...(evidenceRef !== undefined ? { evidenceRef } : {}),
  };
  let raw: unknown;

  try {
    raw = await apiPostJson<unknown>(
      `${governanceStickinessBase()}/risk-exceptions/${encodeRequiredId(riskExceptionId, "riskExceptionId")}/renew`,
      request,
    );
  } catch (error: unknown) {
    rethrowLivelihoodMutate401(error);

    const failure = toApiLoadFailure(error);
    const blockedReason = riskExceptionMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const mapped = mapRiskException(raw);

  if (mapped === null) {
    throw new Error("Risk exception id was not returned.");
  }

  return mapped;
}

export async function createArchitectureReviewRecurrenceSchedule(body: {
  sourceRunId: string;
  name?: string;
  cronExpression?: string;
  isEnabled: boolean;
}): Promise<ArchitectureReviewRecurrenceSchedule> {
  const request = {
    sourceRunId: requiredText(body.sourceRunId, "sourceRunId"),
    isEnabled: body.isEnabled,
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.cronExpression !== undefined ? { cronExpression: body.cronExpression.trim() } : {}),
  };
  let raw: unknown;

  try {
    raw = await apiPostJson<unknown>(`${governanceStickinessBase()}/recurrence-schedules`, request);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const mapped = mapRecurrenceSchedule(raw);

  if (mapped === null) {
    throw new Error("Recurrence schedule id was not returned.");
  }

  return mapped;
}

export async function previewRecurrenceScheduleRuns(body: {
  cronExpression: string;
  count?: number;
  fromUtc?: string;
}): Promise<PreviewRecurrenceScheduleRunsResponse> {
  const request: { cronExpression: string; count?: number; fromUtc?: string } = {
    cronExpression: requiredText(body.cronExpression, "cronExpression"),
  };

  if (body.count !== undefined) {
    if (!Number.isFinite(body.count) || body.count < 1) {
      throw new Error("Preview count must be a positive number.");
    }

    request.count = Math.floor(body.count);
  }

  const fromUtc = body.fromUtc?.trim() ?? "";

  if (fromUtc.length > 0) {
    request.fromUtc = fromUtc;
  }

  try {
    return mapPreviewResponse(await apiPostJson<unknown>(
      `${governanceStickinessBase()}/recurrence-schedules/preview-next-runs`,
      request,
    ));
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function listArchitectureReviewRecurrenceSchedules(): Promise<ArchitectureReviewRecurrenceSchedule[]> {
  try {
    const raw = await apiGet<unknown>(`${governanceStickinessBase()}/recurrence-schedules`);

    return Array.isArray(raw)
      ? raw.flatMap((item) => {
          const mapped = mapRecurrenceSchedule(item);

          return mapped === null ? [] : [mapped];
        })
      : [];
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceSchedulesBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function getRealizedValueAttestation(): Promise<RealizedValueAttestationResponse> {
  try {
    return await apiGetSealedManifestAware<RealizedValueAttestationResponse>(
      `${governanceStickinessBase()}/realized-value/attestation`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = realizedValueAttestationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function updateArchitectureReviewRecurrenceSchedule(
  scheduleId: string,
  body: {
    isEnabled?: boolean;
    name?: string;
    cronExpression?: string;
  },
): Promise<ArchitectureReviewRecurrenceSchedule> {
  const request = {
    ...(body.isEnabled !== undefined ? { isEnabled: body.isEnabled } : {}),
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.cronExpression !== undefined ? { cronExpression: body.cronExpression.trim() } : {}),
  };
  let raw: unknown;

  try {
    raw = await apiPutJson<unknown>(
      `${governanceStickinessBase()}/recurrence-schedules/${encodeRequiredId(scheduleId, "scheduleId")}`,
      request,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = recurrenceScheduleMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const mapped = mapRecurrenceSchedule(raw);

  if (mapped === null) {
    throw new Error("Recurrence schedule id was not returned.");
  }

  return mapped;
}

export async function upsertRealizedValueAttestation(body: UpsertRealizedValueAttestationRequest): Promise<void> {
  try {
    await apiPutNoContent(`${governanceStickinessBase()}/realized-value/attestation`, body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = realizedValueAttestationMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Default waiver duration (90 days) used when the operator does not pick a custom expiry. */
export function defaultRiskExceptionExpiresAtUtc(): string {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 90);
  return expires.toISOString();
}
