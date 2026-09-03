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
export async function saveExecDigestPreferences(
  body: ExecDigestPreferencesUpsertRequest,
): Promise<ExecDigestPreferencesResponse> {
  return apiPostJson<ExecDigestPreferencesResponse>(`/${ApiV1Routes.tenantExecDigestPreferences}`, body);
}

/** Loads Teams incoming-webhook connection and trigger catalog in one GET. */
export async function fetchTeamsIncomingWebhookPageBundle(): Promise<{
  connection: TeamsIncomingWebhookConnectionResponse;
  triggerCatalog: string[];
}> {
  return apiGet(`/${ApiV1Routes.teamsIncomingWebhookPageBundle}`);
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

/** Validates a Key Vault secret reference for Teams webhook delivery (Execute+). */
export async function validateTeamsIncomingWebhookSecret(
  keyVaultSecretName: string,
): Promise<TeamsIncomingWebhookSecretValidationResponse> {
  return apiPostJson<TeamsIncomingWebhookSecretValidationResponse>(
    `/${ApiV1Routes.teamsIncomingWebhookConnections}/validate-secret`,
    { keyVaultSecretName: keyVaultSecretName.trim() },
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
  return apiGet<DigestDeliveryAttempt[]>(
    `/${ApiV1Routes.digestSubscriptions}/digests/${encodeURIComponent(digestId)}/attempts`,
  );
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

  const qs = digestIds.map((id) => encodeURIComponent(id)).join(",");
  const payload = await apiGet<{ items: DigestDeliveryAttemptsBatchItem[] }>(
    `/${ApiV1Routes.digestSubscriptions}/digests/attempts?digestIds=${qs}`,
  );

  return payload.items ?? [];
}

/** Fetches a single architecture digest by ID. */
export async function getArchitectureDigest(digestId: string): Promise<ArchitectureDigest> {
  return apiGet<ArchitectureDigest>(
    `/v1/advisory-scheduling/digests/${encodeURIComponent(digestId)}`,
  );
}
