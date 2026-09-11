import type {
  ArchitectureIdentityDetail,
  ArchitectureIdentityListPage,
} from "@/types/architecture-identity";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import {
  architectureIdentityBlockedReason,
  architectureIdentityListBlockedReason,
} from "@/lib/architecture/architecture-identity-blocked-reason";
import { architectureIdentityMutationBlockedReason } from "@/lib/architecture/architecture-identity-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet, apiPatchJson } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export async function listArchitectureIdentities(params?: {
  readonly page?: number;
  readonly pageSize?: number;
  readonly includeArchived?: boolean;
  readonly scopeHeaders?: Record<string, string>;
}): Promise<ArchitectureIdentityListPage> {
  const search = new URLSearchParams();

  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }

  if (params?.pageSize !== undefined) {
    search.set("pageSize", String(params.pageSize));
  }

  if (params?.includeArchived === true) {
    search.set("includeArchived", "true");
  }

  const query = search.toString();
  const path = query.length > 0 ? `${ARCHITECTURES_BASE}?${query}` : ARCHITECTURES_BASE;

  try {
    return await apiGet<ArchitectureIdentityListPage>(
      path,
      params?.scopeHeaders !== undefined ? { scopeHeaders: params.scopeHeaders } : undefined,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIdentityListBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function getArchitectureIdentity(
  architectureId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<ArchitectureIdentityDetail> {
  try {
    return await apiGet<ArchitectureIdentityDetail>(
      `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}`,
      options,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIdentityBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export type PatchArchitectureIdentityBody = {
  readonly displayName?: string;
  readonly description?: string | null;
  readonly archived?: boolean;
};

export async function patchArchitectureIdentity(
  architectureId: string,
  body: PatchArchitectureIdentityBody,
): Promise<ArchitectureIdentityDetail> {
  try {
    return await apiPatchJson<ArchitectureIdentityDetail>(
      `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIdentityMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
