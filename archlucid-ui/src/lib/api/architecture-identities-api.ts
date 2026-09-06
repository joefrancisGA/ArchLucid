import { apiGet, apiPatchJson } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureIdentityChildPointers = {
  readonly currentOpenDraftId?: string | null;
  readonly currentOpenDraftSystemName?: string | null;
  readonly currentOpenDraftUpdatedUtc?: string | null;
  readonly currentOpenDraftSpawnLocked?: boolean;
  readonly latestReviewRunId?: string | null;
  readonly latestReviewUpdatedUtc?: string | null;
  readonly draftCount: number;
  readonly reviewCount: number;
};

export type ArchitectureIdentityListItem = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly description?: string | null;
  readonly updatedUtc: string;
  readonly latestSealedManifestId?: string | null;
  readonly childPointers: ArchitectureIdentityChildPointers;
};

export type ArchitectureIdentityListPage = {
  readonly items: readonly ArchitectureIdentityListItem[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
};

export type ArchitectureIdentityRecord = {
  readonly architectureId: string;
  readonly displayName: string;
  readonly description?: string | null;
  readonly updatedUtc: string;
  readonly latestSealedManifestId?: string | null;
};

export type ArchitectureIdentityCurrentDraftSummary = {
  readonly draftId: string;
  readonly systemName: string;
  readonly updatedUtc: string;
  readonly spawnLocked: boolean;
};

export type ArchitectureIdentityReviewChildSummary = {
  readonly reviewRunId: string;
  readonly status: string;
  readonly isSealed: boolean;
  readonly updatedUtc: string;
};

export type ArchitectureIdentityWithChildren = {
  readonly identity: ArchitectureIdentityRecord;
  readonly currentDraft?: ArchitectureIdentityCurrentDraftSummary | null;
  readonly reviews: readonly ArchitectureIdentityReviewChildSummary[];
};

export async function listArchitectureIdentities(params?: {
  readonly page?: number;
  readonly pageSize?: number;
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

  return apiGet<ArchitectureIdentityListPage>(path);
}

export async function getArchitectureIdentity(
  architectureId: string,
): Promise<ArchitectureIdentityWithChildren> {
  return apiGet<ArchitectureIdentityWithChildren>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId)}`,
  );
}

export async function patchArchitectureIdentity(
  architectureId: string,
  body: { readonly displayName?: string; readonly description?: string | null },
): Promise<ArchitectureIdentityRecord> {
  return apiPatchJson<ArchitectureIdentityRecord>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId)}`,
    body,
  );
}
