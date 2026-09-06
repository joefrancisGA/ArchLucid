import type {
  ArchitectureIdentityDetail,
  ArchitectureIdentityListPage,
} from "@/types/architecture-identity";

import { apiGet, apiPatchJson } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export async function listArchitectureIdentities(params?: {
  readonly page?: number;
  readonly pageSize?: number;
  readonly scopeHeaders?: Record<string, string>;
}): Promise<ArchitectureIdentityListPage> {
  const search = new URLSearchParams();

  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }

  if (params?.pageSize !== undefined) {
    search.set("pageSize", String(params.pageSize));
  }

  const query = search.toString();
  const path = query.length > 0 ? `${ARCHITECTURES_BASE}?${query}` : ARCHITECTURES_BASE;

  return apiGet<ArchitectureIdentityListPage>(path, params?.scopeHeaders !== undefined
    ? { scopeHeaders: params.scopeHeaders }
    : undefined);
}

export async function getArchitectureIdentity(
  architectureId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ArchitectureIdentityDetail> {
  return apiGet<ArchitectureIdentityDetail>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}`,
    options,
  );
}

export type PatchArchitectureIdentityBody = {
  readonly displayName?: string;
  readonly description?: string | null;
};

export async function patchArchitectureIdentity(
  architectureId: string,
  body: PatchArchitectureIdentityBody,
): Promise<ArchitectureIdentityDetail> {
  return apiPatchJson<ArchitectureIdentityDetail>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}`,
    body,
  );
}
