import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TenantCostSettingsPutRequest, TenantCostSettingsResponse } from "@/types/tenant-cost-settings";

const COST_SETTINGS_PROXY_PATH = "/api/proxy/v1/tenant/cost-settings";

export async function fetchTenantCostSettings(): Promise<TenantCostSettingsResponse> {
  return proxyJsonGet<TenantCostSettingsResponse>(COST_SETTINGS_PROXY_PATH);
}

export async function saveTenantCostSettings(
  body: TenantCostSettingsPutRequest,
): Promise<TenantCostSettingsResponse> {
  return proxyJsonPut<TenantCostSettingsResponse>(COST_SETTINGS_PROXY_PATH, body);
}

export async function invalidateTenantCostSettingsCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.tenantCostSettings });
}
