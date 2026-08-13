import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import {
  parseTenantWorkspacesListPayload,
  type TenantWorkspacesListPayload,
} from "@/lib/tenant-workspaces-list-payload";

const WORKSPACES_PROXY_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;

export async function fetchTenantWorkspacesList(): Promise<TenantWorkspacesListPayload> {
  const res = await fetch(
    WORKSPACES_PROXY_PATH,
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
  );

  if (!res.ok) {
    throw new Error(`Could not load workspaces (${res.status}).`);
  }

  const json: unknown = await res.json();

  return parseTenantWorkspacesListPayload(json);
}

export async function invalidateTenantWorkspacesListCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: ["operator", "tenant", "workspaces"] });
}
