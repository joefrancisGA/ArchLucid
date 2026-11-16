import { isRecord, trimmedStringsOnly, trimTextFields } from "@/lib/api/api-boundary-normalization";
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

/**
 * Every field on these responses is optional, so a non-object response becomes an empty object.
 * Callers then see "not configured" or "not reachable" instead of a crash on a property read.
 */
function recordOrEmpty<T extends object>(raw: unknown): T {
  return (isRecord(raw) ? raw : {}) as T;
}

/** Reads the `items` text list from a named-items response; anything malformed yields an empty list. */
function namedItems(raw: unknown): string[] {
  return isRecord(raw) ? trimmedStringsOnly(raw.items) : [];
}

export async function fetchAzureBoardsHealth(): Promise<AzureBoardsIntegrationHealthResponse> {
  return recordOrEmpty<AzureBoardsIntegrationHealthResponse>(
    await apiGet<unknown>("/v1/integrations/azure-boards/health"),
  );
}

export async function fetchAzureBoardsSettings(): Promise<AzureBoardsOutboundSettingsResponse> {
  return recordOrEmpty<AzureBoardsOutboundSettingsResponse>(
    await apiGet<unknown>("/v1/integrations/azure-boards/settings"),
  );
}

export async function upsertAzureBoardsSettings(
  body: AzureBoardsOutboundSettingsUpsertRequest,
): Promise<AzureBoardsOutboundSettingsResponse> {
  const normalizedBody = trimTextFields(body, [
    "projectName",
    "defaultWorkItemType",
    "areaPath",
    "iterationPath",
    "defaultTags",
  ]);

  return recordOrEmpty<AzureBoardsOutboundSettingsResponse>(
    await apiPutJson<unknown>("/v1/integrations/azure-boards/settings", normalizedBody),
  );
}

export async function listAzureBoardsProjects(): Promise<string[]> {
  const body = await apiGet<unknown>("/v1/integrations/azure-boards/projects");

  return namedItems(body);
}

export async function listAzureBoardsWorkItemTypes(project: string): Promise<string[]> {
  const normalizedProject = project.trim();

  if (normalizedProject.length === 0) {
    throw new Error("project is required.");
  }

  const encoded = encodeURIComponent(normalizedProject);
  const body = await apiGet<unknown>(
    `/v1/integrations/azure-boards/projects/${encoded}/work-item-types`,
  );

  return namedItems(body);
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
