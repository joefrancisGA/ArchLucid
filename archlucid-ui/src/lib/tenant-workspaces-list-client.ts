import { ApiV1Routes } from "@/lib/api-v1-routes";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import {
  parseTenantWorkspacesListPayload,
  type TenantWorkspacesListPayload,
} from "@/lib/tenant-workspaces-list-payload";

const WORKSPACES_PROXY_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;

export async function fetchTenantWorkspacesList(): Promise<TenantWorkspacesListPayload> {
  const json = await proxyJsonGet<unknown>(WORKSPACES_PROXY_PATH, {
    cache: "no-store",
  });

  return parseTenantWorkspacesListPayload(json);
}

export async function invalidateTenantWorkspacesListCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: ["operator", "tenant", "workspaces"] });
}
