import {
  apiDelete,
  apiGet,
  apiPostJson,
  apiPutJson,
  ensureOidcBearerReady,
  resolveRequest,
  throwApiRequestError,
} from "@/lib/api-client";
import { CORRELATION_ID_HEADER, applyTraceParentHeader, captureTraceContextFromResponse } from "@/lib/correlation";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";
import { createItsmOutboundIssueWithJobPolling } from "@/lib/api/itsm-outbound-create";
import type { BackgroundJobInfo } from "@/lib/api/background-jobs-api";
import type { components } from "@/lib/openapi-schemas";
export type ItsmFindingCorrelationListItem = components["schemas"]["ItsmFindingCorrelationListItem"];
export type ItsmFindingCorrelationsByFindingResponse =
  components["schemas"]["ItsmFindingCorrelationsByFindingResponse"];

export type ItsmFindingCorrelationsBatchResponse = {
  findings?: Array<{
    findingId?: string;
    correlations?: ItsmFindingCorrelationListItem[];
  }>;
};
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

export type ItsmAtlassianOAuthConsentStartRequest = {
  instanceBaseUrl: string;
  redirectUri?: string | null;
  oAuthClientIdKeyVaultSecretName: string;
  oAuthClientSecretKeyVaultSecretName: string;
  oAuthRefreshTokenKeyVaultSecretName: string;
  inboundWebhookKeyVaultSecretName?: string | null;
  label?: string | null;
};

export type ItsmAtlassianOAuthConsentStartResponse = {
  authorizeUrl?: string;
  state?: string;
};

export type ItsmAtlassianOAuthConsentCompleteRequest = {
  code: string;
  state: string;
};

export type ItsmAtlassianOAuthConsentCompleteResponse = {
  refreshTokenStored?: boolean;
  connection?: TenantItsmConnectorConnectionResponse | null;
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
    body,
  );
}

export async function deleteTenantItsmConnectorConnection(
  provider: "jira" | "servicenow" | "azureboards",
): Promise<void> {
  await apiDelete(`/v1/integrations/itsm/connections/${provider}`);
}

export function buildItsmAtlassianOAuthRedirectUri(): string {
  if (typeof window === "undefined")
    return "/integrations/itsm/oauth/callback";

  return `${window.location.origin}/integrations/itsm/oauth/callback`;
}

export async function startItsmAtlassianOAuthConsent(
  body: ItsmAtlassianOAuthConsentStartRequest,
): Promise<ItsmAtlassianOAuthConsentStartResponse> {
  return apiPostJson<ItsmAtlassianOAuthConsentStartResponse>(
    "/v1/integrations/itsm/connections/jira/oauth/consent/start",
    body,
  );
}

export type ItsmAtlassianOAuthConsentCompleteResult = ItsmAtlassianOAuthConsentCompleteResponse & {
  readonly correlationId: string;
};

export async function completeItsmAtlassianOAuthConsent(
  body: ItsmAtlassianOAuthConsentCompleteRequest,
  options?: { readonly correlationId?: string },
): Promise<ItsmAtlassianOAuthConsentCompleteResult> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(
    "/v1/integrations/itsm/connections/jira/oauth/consent/complete",
  );
  const correlationId = ensureCorrelationId(options?.correlationId);
  const requestHeaders = new Headers(headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);
  applyTraceParentHeader(requestHeaders);
  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  const data = JSON.parse(text) as ItsmAtlassianOAuthConsentCompleteResponse;

  return { ...data, correlationId };
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

export async function listItsmFindingCorrelationsBatch(
  findingIds: readonly string[],
): Promise<ItsmFindingCorrelationsBatchResponse> {
  const q = new URLSearchParams();

  for (const findingId of findingIds) {
    if (findingId.trim().length === 0) {
      continue;
    }

    q.append("findingIds", findingId.trim());
  }

  return apiGet<ItsmFindingCorrelationsBatchResponse>(
    `/v1/integrations/itsm/correlations/batch?${q}`,
  );
}

export async function createItsmOutboundIssue(
  findingId: string,
  provider: "Jira" | "ServiceNow" | "Azure Boards",
  onJobPending?: (job: BackgroundJobInfo) => void,
): Promise<CreateItsmOutboundIssueResponse> {
  return createItsmOutboundIssueWithJobPolling(findingId, provider, onJobPending);
}
