import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TenantCostSettingsPutRequest, TenantCostSettingsResponse } from "@/types/tenant-cost-settings";

const COST_SETTINGS_PROXY_PATH = "/api/proxy/v1/tenant/cost-settings";

export async function fetchTenantCostSettings(): Promise<TenantCostSettingsResponse> {
  const res = await fetch(COST_SETTINGS_PROXY_PATH, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();

    throw toApiLoadFailure({ status: res.status, body: text });
  }

  return (await res.json()) as TenantCostSettingsResponse;
}

export async function saveTenantCostSettings(
  body: TenantCostSettingsPutRequest,
): Promise<TenantCostSettingsResponse> {
  const res = await fetch(COST_SETTINGS_PROXY_PATH, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();

    throw toApiLoadFailure({ status: res.status, body: text });
  }

  return (await res.json()) as TenantCostSettingsResponse;
}

export async function invalidateTenantCostSettingsCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.tenantCostSettings });
}
