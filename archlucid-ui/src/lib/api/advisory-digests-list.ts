import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  AdvisoryScanExecution,
  AdvisoryScanSchedule,
  ArchitectureDigest,
} from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";
import { apiGet, apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

/** Lists all advisory scan schedules for the current scope. */
export async function listAdvisorySchedules(): Promise<AdvisoryScanSchedule[]> {
  return apiGet<AdvisoryScanSchedule[]>("/v1/advisory-scheduling/schedules");
}

/** Creates a new advisory scan schedule with a cron expression. */
export async function createAdvisorySchedule(body: {
  name: string;
  cronExpression: string;
  runProjectSlug?: string;
  isEnabled?: boolean;
}): Promise<AdvisoryScanSchedule> {
  return apiPostJson<AdvisoryScanSchedule>("/v1/advisory-scheduling/schedules", {
    name: body.name,
    cronExpression: body.cronExpression,
    runProjectSlug: body.runProjectSlug?.trim() || "default",
    isEnabled: body.isEnabled ?? true,
  });
}

/** Triggers an immediate execution of an advisory scan schedule. */
export async function runAdvisoryScheduleNow(scheduleId: string): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(
    `/v1/advisory-scheduling/schedules/${encodeURIComponent(scheduleId)}/run`,
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
  return apiGet<AdvisoryScanExecution[]>(
    `/v1/advisory-scheduling/schedules/${encodeURIComponent(scheduleId)}/executions?take=${take}`,
  );
}

/** Lists recent architecture digests (periodic summary reports). */
export async function listArchitectureDigests(take = 20): Promise<ArchitectureDigest[]> {
  return apiGet<ArchitectureDigest[]>(`/v1/advisory-scheduling/digests?take=${take}`);
}

/** Lists all digest delivery subscriptions (email, webhook, etc.). */
export async function listDigestSubscriptions(): Promise<DigestSubscription[]> {
  return apiGet<DigestSubscription[]>(`/${ApiV1Routes.digestSubscriptions}`);
}

/** Creates a new digest delivery subscription. */
export async function createDigestSubscription(body: {
  name: string;
  channelType: string;
  destination: string;
  isEnabled?: boolean;
  metadataJson?: string;
}): Promise<DigestSubscription> {
  return apiPostJson<DigestSubscription>(`/${ApiV1Routes.digestSubscriptions}`, {
    name: body.name,
    channelType: body.channelType,
    destination: body.destination,
    isEnabled: body.isEnabled ?? true,
    metadataJson: body.metadataJson ?? "{}",
  });
}

/** Toggles a digest subscription between enabled and disabled. */
export async function toggleDigestSubscription(subscriptionId: string): Promise<DigestSubscription> {
  return apiPostJson<DigestSubscription>(
    `/v1/digest-subscriptions/${encodeURIComponent(subscriptionId)}/toggle`,
    {},
  );
}

/** Lists delivery attempts for a specific digest subscription. */
export async function listSubscriptionDeliveryAttempts(
  subscriptionId: string,
  take = 50,
): Promise<DigestDeliveryAttempt[]> {
  return apiGet<DigestDeliveryAttempt[]>(
    `/${ApiV1Routes.digestSubscriptions}/${encodeURIComponent(subscriptionId)}/attempts?take=${take}`,
  );
}
