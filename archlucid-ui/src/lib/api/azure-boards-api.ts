import { apiGet, apiPostJson, apiPutJson } from "@/lib/api-client";
import { interpretAzureBoardsLastConnectionTest } from "@/lib/azure-boards-stored-health";

export type AzureBoardsIntegrationHealthResponse = {
  status?: string;
  reachable?: boolean;
  summary?: string;
  statusCode?: number | null;
};

export type AzureBoardsNamedItemsResponse = {
  items?: string[];
};

export type AzureBoardsOutboundSettingsResponse = {
  tenantId?: string;
  isConfigured?: boolean;
  projectName?: string | null;
  defaultWorkItemType?: string | null;
  areaPath?: string | null;
  iterationPath?: string | null;
  defaultTags?: string | null;
  lastConnectionTestUtc?: string | null;
  lastConnectionTestSummary?: string | null;
};

export type AzureBoardsOutboundSettingsUpsertRequest = {
  projectName: string;
  defaultWorkItemType: string;
  areaPath?: string | null;
  iterationPath?: string | null;
  defaultTags?: string | null;
};

export type AzureBoardsConnectionTestResponse = {
  ok?: boolean;
  summary?: string;
  statusCode?: number | null;
};

export async function fetchAzureBoardsHealth(): Promise<AzureBoardsIntegrationHealthResponse> {
  return apiGet<AzureBoardsIntegrationHealthResponse>("/v1/integrations/azure-boards/health");
}

export async function fetchAzureBoardsSettings(): Promise<AzureBoardsOutboundSettingsResponse> {
  return apiGet<AzureBoardsOutboundSettingsResponse>("/v1/integrations/azure-boards/settings");
}

export async function upsertAzureBoardsSettings(
  body: AzureBoardsOutboundSettingsUpsertRequest,
): Promise<AzureBoardsOutboundSettingsResponse> {
  return apiPutJson<AzureBoardsOutboundSettingsResponse>("/v1/integrations/azure-boards/settings", body);
}

export async function listAzureBoardsProjects(): Promise<string[]> {
  const body = await apiGet<AzureBoardsNamedItemsResponse>("/v1/integrations/azure-boards/projects");

  return body.items ?? [];
}

export async function listAzureBoardsWorkItemTypes(project: string): Promise<string[]> {
  const encoded = encodeURIComponent(project);
  const body = await apiGet<AzureBoardsNamedItemsResponse>(
    `/v1/integrations/azure-boards/projects/${encoded}/work-item-types`,
  );

  return body.items ?? [];
}

export async function testAzureBoardsConnection(): Promise<AzureBoardsConnectionTestResponse> {
  return apiPostJson<AzureBoardsConnectionTestResponse>("/v1/integrations/azure-boards/test-connection", {});
}

export function isAzureBoardsNativeCreateReady(
  settings: AzureBoardsOutboundSettingsResponse | null | undefined,
): boolean {
  if (settings == null || settings.isConfigured !== true) {
    return false;
  }

  if ((settings.projectName?.trim().length ?? 0) === 0) {
    return false;
  }

  if ((settings.defaultWorkItemType?.trim().length ?? 0) === 0) {
    return false;
  }

  return interpretAzureBoardsLastConnectionTest(
    settings.lastConnectionTestUtc,
    settings.lastConnectionTestSummary,
  ) === true;
}
