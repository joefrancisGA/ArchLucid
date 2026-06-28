import { apiDelete, apiGet, apiPostJson, apiPutJson } from "@/lib/api-client";
import { createItsmOutboundIssueWithJobPolling } from "@/lib/api/itsm-outbound-create";
import type { BackgroundJobInfo } from "@/lib/api/background-jobs-api";
import type { components } from "@/lib/openapi-schemas";
export type ItsmFindingCorrelationListItem = components["schemas"]["ItsmFindingCorrelationListItem"];
export type ItsmFindingCorrelationsByFindingResponse =
  components["schemas"]["ItsmFindingCorrelationsByFindingResponse"];
export type CreateItsmOutboundIssueResponse = components["schemas"]["CreateItsmOutboundIssueResponse"];
export type ItsmIntegrationHealthResponse = components["schemas"]["ItsmIntegrationHealthResponse"];

/** TB-404 tenant settings — OpenAPI snapshot pending regen. */
export type TenantItsmDeploymentCredentialSummary = {
  jiraConfigured?: boolean;
  jiraServiceAccountEmailMasked?: string | null;
  serviceNowConfigured?: boolean;
  serviceNowUsernameMasked?: string | null;
};

export type TenantItsmConnectorConnectionResponse = {
  tenantId?: string;
  provider?: string;
  isConfigured?: boolean;
  isEnabled?: boolean;
  instanceBaseUrl?: string | null;
  authUserName?: string | null;
  credentialKeyVaultSecretName?: string | null;
  inboundWebhookKeyVaultSecretName?: string | null;
  label?: string | null;
  updatedUtc?: string;
};

export type TenantItsmConnectorConnectionUpsertRequest = {
  instanceBaseUrl: string;
  authUserName: string;
  credentialKeyVaultSecretName: string;
  inboundWebhookKeyVaultSecretName?: string | null;
  isEnabled?: boolean;
  label?: string | null;
};

export type TenantItsmOutboundSettingsResponse = {
  tenantId?: string;
  hasTenantOverrides?: boolean;
  jiraProjectKeyOverride?: string | null;
  jiraSendInfoSeverity?: boolean;
  jiraIssueTypeBySeverityJson?: string | null;
  serviceNowAutoCreateCmdbCi?: boolean;
  deploymentCredentials?: TenantItsmDeploymentCredentialSummary;
  nativeEnabled?: boolean;
};

export type TenantItsmOutboundSettingsUpsertRequest = {
  jiraProjectKeyOverride?: string | null;
  jiraSendInfoSeverity?: boolean | null;
  jiraIssueTypeBySeverityJson?: string | null;
  serviceNowAutoCreateCmdbCi?: boolean | null;
};

export async function fetchItsmIntegrationHealth(): Promise<ItsmIntegrationHealthResponse> {
  return apiGet<ItsmIntegrationHealthResponse>("/v1/integrations/itsm/health");
}

export async function fetchTenantItsmOutboundSettings(): Promise<TenantItsmOutboundSettingsResponse> {
  return apiGet<TenantItsmOutboundSettingsResponse>("/v1/integrations/itsm/settings");
}

export async function upsertTenantItsmOutboundSettings(
  body: TenantItsmOutboundSettingsUpsertRequest,
): Promise<TenantItsmOutboundSettingsResponse> {
  return apiPutJson<TenantItsmOutboundSettingsResponse>("/v1/integrations/itsm/settings", body);
}

export async function fetchTenantItsmConnectorConnection(
  provider: "jira" | "servicenow",
): Promise<TenantItsmConnectorConnectionResponse> {
  return apiGet<TenantItsmConnectorConnectionResponse>(`/v1/integrations/itsm/connections/${provider}`);
}

export async function upsertTenantItsmConnectorConnection(
  provider: "jira" | "servicenow",
  body: TenantItsmConnectorConnectionUpsertRequest,
): Promise<TenantItsmConnectorConnectionResponse> {
  return apiPostJson<TenantItsmConnectorConnectionResponse>(
    `/v1/integrations/itsm/connections/${provider}`,
    body,
  );
}

export async function deleteTenantItsmConnectorConnection(provider: "jira" | "servicenow"): Promise<void> {
  await apiDelete(`/v1/integrations/itsm/connections/${provider}`);
}

export async function listItsmFindingCorrelations(
  findingId: string,
): Promise<ItsmFindingCorrelationsByFindingResponse> {
  const q = new URLSearchParams();
  q.set("findingId", findingId);

  return apiGet<ItsmFindingCorrelationsByFindingResponse>(
    `/v1/integrations/itsm/correlations?${q}`,
  );
}

export async function createItsmOutboundIssue(
  findingId: string,
  provider: "Jira" | "ServiceNow",
  onJobPending?: (job: BackgroundJobInfo) => void,
): Promise<CreateItsmOutboundIssueResponse> {
  return createItsmOutboundIssueWithJobPolling(findingId, provider, onJobPending);
}