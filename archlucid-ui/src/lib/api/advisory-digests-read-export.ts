import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";
import type {
  ExecDigestPreferencesResponse,
  ExecDigestPreferencesUpsertRequest,
} from "@/types/exec-digest-preferences";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionTestResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
  TeamsIncomingWebhookSecretValidationResponse,
} from "@/types/teams-incoming-webhook-connection";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";
import {
  recordsOnly,
  requireRecord,
  trimRequiredPathSegment,
  trimRequiredText,
  trimStringList,
  trimTextFields,
} from "./api-boundary-normalization";
import { apiDelete, apiGet, apiPostJson } from "./http";

/** Loads weekly sponsor digest email preferences for the current tenant. */
export async function getExecDigestPreferences(): Promise<ExecDigestPreferencesResponse> {
  return apiGet<ExecDigestPreferencesResponse>(`/${ApiV1Routes.tenantExecDigestPreferences}`);
}

/** Best-effort tenant trial banner payload; returns null when the route errors (UI treats as unknown trial state). */
export async function tryGetTenantTrialStatus(): Promise<TenantTrialStatusPayload | null> {
  try {
    return await apiGet<TenantTrialStatusPayload>(`/${ApiV1Routes.tenantTrialStatus}`);
  } catch {
    return null;
  }
}

/** Saves weekly sponsor digest email preferences (Execute+). */
function normalizeExecDigestPreferencesUpsert(
  body: ExecDigestPreferencesUpsertRequest,
): ExecDigestPreferencesUpsertRequest {
  const dayOfWeek = Math.floor(body.dayOfWeek);
  const hourOfDay = Math.floor(body.hourOfDay);

  if (!Number.isFinite(body.dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("dayOfWeek must be between 0 and 6.");
  }

  if (!Number.isFinite(body.hourOfDay) || hourOfDay < 0 || hourOfDay > 23) {
    throw new Error("hourOfDay must be between 0 and 23.");
  }

  return {
    ...body,
    recipientEmails: trimStringList(body.recipientEmails),
    ianaTimeZoneId: trimRequiredText(body.ianaTimeZoneId, "ianaTimeZoneId"),
    dayOfWeek,
    hourOfDay,
  };
}

export async function saveExecDigestPreferences(
  body: ExecDigestPreferencesUpsertRequest,
): Promise<ExecDigestPreferencesResponse> {
  return apiPostJson<ExecDigestPreferencesResponse>(
    `/${ApiV1Routes.tenantExecDigestPreferences}`,
    normalizeExecDigestPreferencesUpsert(body),
  );
}

/** Loads Teams incoming-webhook connection and trigger catalog in one GET. */
export async function fetchTeamsIncomingWebhookPageBundle(): Promise<{
  connection: TeamsIncomingWebhookConnectionResponse;
  triggerCatalog: string[];
}> {
  const raw = requireRecord<{
    connection: TeamsIncomingWebhookConnectionResponse;
    triggerCatalog: unknown;
  }>(await apiGet<unknown>(`/${ApiV1Routes.teamsIncomingWebhookPageBundle}`), "Teams incoming webhook page bundle");

  return {
    connection: raw.connection,
    triggerCatalog: Array.isArray(raw.triggerCatalog)
      ? raw.triggerCatalog
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : [],
  };
}

/** Loads Teams incoming-webhook Key Vault reference for the current tenant (secret value never returned). */
export async function getTeamsIncomingWebhookConnection(): Promise<TeamsIncomingWebhookConnectionResponse> {
  return apiGet<TeamsIncomingWebhookConnectionResponse>(`/${ApiV1Routes.teamsIncomingWebhookConnections}`);
}

/** Upserts Teams incoming-webhook Key Vault secret name reference (Execute+). */
export async function upsertTeamsIncomingWebhookConnection(
  body: TeamsIncomingWebhookConnectionUpsertRequest,
): Promise<TeamsIncomingWebhookConnectionResponse> {
  return apiPostJson<TeamsIncomingWebhookConnectionResponse>(
    `/${ApiV1Routes.teamsIncomingWebhookConnections}`,
    trimTextFields(body, ["keyVaultSecretName"]),
  );
}

/** Removes Teams Key Vault reference (Execute+). */
export async function deleteTeamsIncomingWebhookConnection(): Promise<void> {
  return apiDelete(`/${ApiV1Routes.teamsIncomingWebhookConnections}`);
}

/** Loads the canonical v1 Teams notification trigger catalog (canonical event-type strings). */
export async function getTeamsNotificationTriggerCatalog(): Promise<string[]> {
  const payload = await apiGet<unknown>(`/${ApiV1Routes.teamsNotificationTriggerCatalog}`);

  return Array.isArray(payload)
    ? payload.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
}

/** Validates a Key Vault secret reference for Teams webhook delivery (Execute+). */
export async function validateTeamsIncomingWebhookSecret(
  keyVaultSecretName: string,
): Promise<TeamsIncomingWebhookSecretValidationResponse> {
  return apiPostJson<TeamsIncomingWebhookSecretValidationResponse>(
    `/${ApiV1Routes.teamsIncomingWebhookConnections}/validate-secret`,
    { keyVaultSecretName: trimRequiredText(keyVaultSecretName, "keyVaultSecretName") },
  );
}

/** Sends a synthetic Teams test notification (Execute+). */
export async function testTeamsIncomingWebhookConnection(
  keyVaultSecretName?: string | null,
): Promise<TeamsIncomingWebhookConnectionTestResponse> {
  const trimmed = keyVaultSecretName?.trim() ?? "";

  return apiPostJson<TeamsIncomingWebhookConnectionTestResponse>(
    `/${ApiV1Routes.teamsIncomingWebhookConnections}/test`,
    trimmed.length > 0 ? { keyVaultSecretName: trimmed } : {},
  );
}

/** Lists all delivery attempts for a specific digest. */
export async function listDigestDeliveryAttempts(digestId: string): Promise<DigestDeliveryAttempt[]> {
  const normalizedDigestId = trimRequiredPathSegment(digestId, "digestId");

  return recordsOnly<DigestDeliveryAttempt>(await apiGet<unknown>(
    `/${ApiV1Routes.digestSubscriptions}/digests/${encodeURIComponent(normalizedDigestId)}/attempts`,
  ));
}

/** One digest’s attempts within a batch delivery-attempt response. */
export type DigestDeliveryAttemptsBatchItem = {
  digestId: string;
  attempts: DigestDeliveryAttempt[];
};

/** Batch delivery attempts for many digests (`?digestIds=guid,guid`). */
export async function listDigestDeliveryAttemptsBatch(
  digestIds: readonly string[],
): Promise<DigestDeliveryAttemptsBatchItem[]> {
  if (digestIds.length === 0) {
    return [];
  }

  const qs = digestIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => encodeURIComponent(id))
    .join(",");

  if (qs.length === 0) {
    return [];
  }

  const payload = await apiGet<{ items: DigestDeliveryAttemptsBatchItem[] }>(
    `/${ApiV1Routes.digestSubscriptions}/digests/attempts?digestIds=${qs}`,
  );

  return recordsOnly<DigestDeliveryAttemptsBatchItem>(payload.items);
}

/** Fetches a single architecture digest by ID. */
export async function getArchitectureDigest(digestId: string): Promise<ArchitectureDigest> {
  const normalizedDigestId = trimRequiredPathSegment(digestId, "digestId");

  return apiGet<ArchitectureDigest>(
    `/v1/advisory-scheduling/digests/${encodeURIComponent(normalizedDigestId)}`,
  );
}
