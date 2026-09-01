import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";

const PROXY_PATH = "/api/proxy/v1/admin/settings/work-ownership-delete-policy";

export type TenantWorkOwnershipDeletePolicyResponse = {
  allowCreatorDeleteOwnedWork: boolean;
};

export type TenantWorkOwnershipDeletePolicyUpdateRequest = {
  allowCreatorDeleteOwnedWork: boolean;
};

export function parseTenantWorkOwnershipDeletePolicy(body: unknown): TenantWorkOwnershipDeletePolicyResponse | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as TenantWorkOwnershipDeletePolicyResponse;

  if (typeof record.allowCreatorDeleteOwnedWork !== "boolean") {
    return null;
  }

  return record;
}

export async function fetchTenantWorkOwnershipDeletePolicy(): Promise<TenantWorkOwnershipDeletePolicyResponse> {
  const payload = await proxyJsonGet<TenantWorkOwnershipDeletePolicyResponse>(PROXY_PATH, {
    cache: "no-store",
  });
  const parsed = parseTenantWorkOwnershipDeletePolicy(payload);

  if (parsed === null) {
    throw new Error("Work ownership delete policy response was invalid.");
  }

  return parsed;
}

export async function updateTenantWorkOwnershipDeletePolicy(
  request: TenantWorkOwnershipDeletePolicyUpdateRequest,
): Promise<TenantWorkOwnershipDeletePolicyResponse> {
  const payload = await proxyJsonPut<TenantWorkOwnershipDeletePolicyResponse>(PROXY_PATH, request);
  const parsed = parseTenantWorkOwnershipDeletePolicy(payload);

  if (parsed === null) {
    throw new Error("Work ownership delete policy response was invalid.");
  }

  return parsed;
}
