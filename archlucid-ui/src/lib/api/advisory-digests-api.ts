import { ApiV1Routes } from "@/lib/api-v1-routes";
import type {
  AdvisoryScanExecution,
  AdvisoryScanSchedule,
  ArchitectureDigest,
} from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";
import type {
  ExecDigestPreferencesResponse,
  ExecDigestPreferencesUpsertRequest,
} from "@/types/exec-digest-preferences";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
} from "@/types/teams-incoming-webhook-connection";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";
import { apiDelete, apiGet, apiPostJson, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "./http";

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
  const { url, headers } = resolveRequest(
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

/** Loads weekly executive digest email preferences for the current tenant. */
export async function getExecDigestPreferences(): Promise<ExecDigestPreferencesResponse> {
  return apiGet<ExecDigestPreferencesResponse>(`/${ApiV1Routes.tenantExecDigestPreferences}`);
}

/** Rough monthly spend band for Standard+ tenants (404 when below Standard; route not disclosed). */
export async function getTenantCostEstimate(): Promise<TenantCostEstimateResponse> {
  return apiGet<TenantCostEstimateResponse>(`/${ApiV1Routes.tenantCostEstimate}`);
}

/** Saves weekly executive digest email preferences (Execute+). */
export async function saveExecDigestPreferences(
  body: ExecDigestPreferencesUpsertRequest,
): Promise<ExecDigestPreferencesResponse> {
  return apiPostJson<ExecDigestPreferencesResponse>(`/${ApiV1Routes.tenantExecDigestPreferences}`, body);
}

/** Loads Teams incoming-webhook Key Vault reference for the current tenant (secret value never returned). */
export async function getTeamsIncomingWebhookConnection(): Promise<TeamsIncomingWebhookConnectionResponse> {
  return apiGet<TeamsIncomingWebhookConnectionResponse>(`/${ApiV1Routes.teamsIncomingWebhookConnections}`);
}

/** Upserts Teams incoming-webhook Key Vault secret name reference (Execute+). */
export async function upsertTeamsIncomingWebhookConnection(
  body: TeamsIncomingWebhookConnectionUpsertRequest,
): Promise<TeamsIncomingWebhookConnectionResponse> {
  return apiPostJson<TeamsIncomingWebhookConnectionResponse>(`/${ApiV1Routes.teamsIncomingWebhookConnections}`, body);
}

/** Removes Teams Key Vault reference (Execute+). */
export async function deleteTeamsIncomingWebhookConnection(): Promise<void> {
  return apiDelete(`/${ApiV1Routes.teamsIncomingWebhookConnections}`);
}

/** Loads the canonical v1 Teams notification trigger catalog (canonical event-type strings). */
export async function getTeamsNotificationTriggerCatalog(): Promise<string[]> {
  return apiGet<string[]>(`/${ApiV1Routes.teamsNotificationTriggerCatalog}`);
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

/** Lists all delivery attempts for a specific digest. */
export async function listDigestDeliveryAttempts(digestId: string): Promise<DigestDeliveryAttempt[]> {
  return apiGet<DigestDeliveryAttempt[]>(
    `/${ApiV1Routes.digestSubscriptions}/digests/${encodeURIComponent(digestId)}/attempts`,
  );
}

/** Fetches a single architecture digest by ID. */
export async function getArchitectureDigest(digestId: string): Promise<ArchitectureDigest> {
  return apiGet<ArchitectureDigest>(
    `/v1/advisory-scheduling/digests/${encodeURIComponent(digestId)}`,
  );
}
