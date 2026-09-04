import { apiGet, apiPostJson } from "@/lib/api-client";
import type { components } from "@/lib/openapi-schemas";
import type {
  TenantItsmConnectorConnectionResponse,
  TenantItsmOutboundSettingsResponse,
} from "./itsm-outbound-connections-settings";

export type ItsmIntegrationHealthResponse = components["schemas"]["ItsmIntegrationHealthResponse"];

export async function fetchItsmIntegrationHealth(): Promise<ItsmIntegrationHealthResponse> {
  return apiGet<ItsmIntegrationHealthResponse>("/v1/integrations/itsm/health");
}

export async function probeItsmIntegrationHealth(): Promise<ItsmIntegrationHealthResponse> {
  return apiPostJson<ItsmIntegrationHealthResponse>("/v1/integrations/itsm/health/probe", {});
}

export async function fetchItsmProviderPageBundle(
  provider: "jira" | "servicenow",
): Promise<{
  health: ItsmIntegrationHealthResponse;
  settings: TenantItsmOutboundSettingsResponse;
  connection: TenantItsmConnectorConnectionResponse;
}> {
  return apiGet(`/v1/integrations/itsm/${provider}/page-bundle`);
}
