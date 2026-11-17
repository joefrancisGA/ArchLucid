import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  AdvisoryScanExecution,
  AdvisoryScanSchedule,
  ArchitectureDigest,
} from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";
import {
  positiveIntegerOrDefault,
  recordsOnly,
  trimRequiredPathSegment,
  trimRequiredText,
} from "./api-boundary-normalization";
import { apiGet, apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

/** Lists all advisory scan schedules for the current scope. */
export async function listAdvisorySchedules(): Promise<AdvisoryScanSchedule[]> {
  return recordsOnly<AdvisoryScanSchedule>(await apiGet<unknown>("/v1/advisory-scheduling/schedules"));
}

/** Creates a new advisory scan schedule with a cron expression. */
export async function createAdvisorySchedule(body: {
  name: string;
  cronExpression: string;
  runProjectSlug?: string;
  isEnabled?: boolean;
}): Promise<AdvisoryScanSchedule> {
  const runProjectSlug = body.runProjectSlug?.trim();

  return apiPostJson<AdvisoryScanSchedule>("/v1/advisory-scheduling/schedules", {
    name: trimRequiredText(body.name, "name"),
    cronExpression: trimRequiredText(body.cronExpression, "cronExpression"),
    ...(runProjectSlug !== undefined && runProjectSlug.length > 0 ? { runProjectSlug } : {}),
    isEnabled: body.isEnabled ?? true,
  });
}

/** Triggers an immediate execution of an advisory scan schedule. */
export async function runAdvisoryScheduleNow(scheduleId: string): Promise<void> {
  const normalizedScheduleId = trimRequiredPathSegment(scheduleId, "scheduleId");
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(
    `/v1/advisory-scheduling/schedules/${encodeURIComponent(normalizedScheduleId)}/run`,
  );
  const h = withCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, { method: "POST", headers: h, cache: "no-store" });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text);
  }
}

/** Lists recent executions for an advisory scan schedule. */
export async function listScheduleExecutions(
  scheduleId: string,
  take = 30,
): Promise<AdvisoryScanExecution[]> {
  const normalizedScheduleId = trimRequiredPathSegment(scheduleId, "scheduleId");

  return recordsOnly<AdvisoryScanExecution>(await apiGet<unknown>(
    `/v1/advisory-scheduling/schedules/${encodeURIComponent(normalizedScheduleId)}/executions?take=${positiveIntegerOrDefault(take, 30)}`,
  ));
}

/** Lists recent architecture digests (periodic summary reports). */
export async function listArchitectureDigests(take = 20): Promise<ArchitectureDigest[]> {
  return recordsOnly<ArchitectureDigest>(await apiGet<unknown>(
    `/v1/advisory-scheduling/digests?take=${positiveIntegerOrDefault(take, 20)}`,
  ));
}

/** Lists all digest delivery subscriptions (email, webhook, etc.). */
export async function listDigestSubscriptions(): Promise<DigestSubscription[]> {
  return recordsOnly<DigestSubscription>(await apiGet<unknown>(`/${ApiV1Routes.digestSubscriptions}`));
}

/** Creates a new digest delivery subscription. */
export async function createDigestSubscription(body: {
  name: string;
  channelType: string;
  destination: string;
  isEnabled?: boolean;
  metadataJson?: string;
}): Promise<DigestSubscription> {
  const metadataJson = body.metadataJson?.trim();

  return apiPostJson<DigestSubscription>(`/${ApiV1Routes.digestSubscriptions}`, {
    name: trimRequiredText(body.name, "name"),
    channelType: trimRequiredText(body.channelType, "channelType"),
    destination: trimRequiredText(body.destination, "destination"),
    isEnabled: body.isEnabled ?? true,
    ...(metadataJson !== undefined && metadataJson.length > 0 ? { metadataJson } : {}),
  });
}

/** Toggles a digest subscription between enabled and disabled. */
export async function toggleDigestSubscription(subscriptionId: string): Promise<DigestSubscription> {
  const normalizedSubscriptionId = trimRequiredPathSegment(subscriptionId, "subscriptionId");

  return apiPostJson<DigestSubscription>(
    `/v1/digest-subscriptions/${encodeURIComponent(normalizedSubscriptionId)}/toggle`,
    {},
  );
}

/** Lists delivery attempts for a specific digest subscription. */
export async function listSubscriptionDeliveryAttempts(
  subscriptionId: string,
  take = 50,
): Promise<DigestDeliveryAttempt[]> {
  const normalizedSubscriptionId = trimRequiredPathSegment(subscriptionId, "subscriptionId");

  return recordsOnly<DigestDeliveryAttempt>(await apiGet<unknown>(
    `/${ApiV1Routes.digestSubscriptions}/${encodeURIComponent(normalizedSubscriptionId)}/attempts?take=${positiveIntegerOrDefault(take, 50)}`,
  ));
}
