import { apiGet, apiPostJson, apiPutJson } from "@/lib/api-client";
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
): Promise<CreateItsmOutboundIssueResponse> {
  return apiPostJson<CreateItsmOutboundIssueResponse>("/v1/integrations/itsm/outbound/issues", {
    findingId,
    provider,
  });
}
