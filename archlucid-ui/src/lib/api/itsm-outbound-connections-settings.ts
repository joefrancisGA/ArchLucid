import { trimTextFields } from "@/lib/api/api-boundary-normalization";
import { apiDelete, apiGet, apiPostJson, apiPutJson } from "@/lib/api-client";

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
  authMode?: string | null;
  authUserName?: string | null;
  credentialKeyVaultSecretName?: string | null;
  oAuthClientIdKeyVaultSecretName?: string | null;
  oAuthClientSecretKeyVaultSecretName?: string | null;
  oAuthRefreshTokenKeyVaultSecretName?: string | null;
  inboundWebhookKeyVaultSecretName?: string | null;
  label?: string | null;
  updatedUtc?: string;
};

export type TenantItsmConnectorConnectionUpsertRequest = {
  instanceBaseUrl: string;
  authMode?: string | null;
  authUserName?: string | null;
  credentialKeyVaultSecretName?: string | null;
  oAuthClientIdKeyVaultSecretName?: string | null;
  oAuthClientSecretKeyVaultSecretName?: string | null;
  oAuthRefreshTokenKeyVaultSecretName?: string | null;
  inboundWebhookKeyVaultSecretName?: string | null;
  isEnabled?: boolean;
  label?: string | null;
};

/** Connection fields pasted by an admin (URL, user name, Key Vault secret names); stray spaces break lookups. */
const CONNECTION_TEXT_FIELDS: readonly (keyof TenantItsmConnectorConnectionUpsertRequest & string)[] = [
  "instanceBaseUrl",
  "authMode",
  "authUserName",
  "credentialKeyVaultSecretName",
  "oAuthClientIdKeyVaultSecretName",
  "oAuthClientSecretKeyVaultSecretName",
  "oAuthRefreshTokenKeyVaultSecretName",
  "inboundWebhookKeyVaultSecretName",
  "label",
];

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

export async function fetchTenantItsmOutboundSettings(): Promise<TenantItsmOutboundSettingsResponse> {
  return apiGet<TenantItsmOutboundSettingsResponse>("/v1/integrations/itsm/settings");
}

export async function upsertTenantItsmOutboundSettings(
  body: TenantItsmOutboundSettingsUpsertRequest,
): Promise<TenantItsmOutboundSettingsResponse> {
  // The issue-type JSON is sent exactly as authored; only the project key is trimmed.
  return apiPutJson<TenantItsmOutboundSettingsResponse>(
    "/v1/integrations/itsm/settings",
    trimTextFields(body, ["jiraProjectKeyOverride"]),
  );
}

export async function fetchTenantItsmConnectorConnection(
  provider: "jira" | "servicenow" | "azureboards",
): Promise<TenantItsmConnectorConnectionResponse> {
  return apiGet<TenantItsmConnectorConnectionResponse>(`/v1/integrations/itsm/connections/${provider}`);
}

export async function upsertTenantItsmConnectorConnection(
  provider: "jira" | "servicenow" | "azureboards",
  body: TenantItsmConnectorConnectionUpsertRequest,
): Promise<TenantItsmConnectorConnectionResponse> {
  return apiPostJson<TenantItsmConnectorConnectionResponse>(
    `/v1/integrations/itsm/connections/${provider}`,
    trimTextFields(body, CONNECTION_TEXT_FIELDS),
  );
}

export async function deleteTenantItsmConnectorConnection(
  provider: "jira" | "servicenow" | "azureboards",
): Promise<void> {
  await apiDelete(`/v1/integrations/itsm/connections/${provider}`);
}
