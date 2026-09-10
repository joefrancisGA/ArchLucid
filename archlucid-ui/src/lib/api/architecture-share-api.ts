import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiDelete, apiPutJson, apiPutNoContent } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureShareGrant = {
  userId: string;
  role: string;
  grantedBy: string;
  grantedUtc: string;
};

export type ArchitectureShareListResponse = {
  architectureId: string;
  restrictToShares: boolean;
  shares: ArchitectureShareGrant[];
  confirmationCopy?: string;
};

export type UpsertArchitectureShareRequest = {
  role: string;
};

export type SetArchitectureRestrictToSharesRequest = {
  restrictToShares: boolean;
  confirmOptIn: boolean;
};

export type ArchitectureRestrictToSharesResponse = {
  architectureId: string;
  restrictToShares: boolean;
  actorAdminShareInserted?: boolean;
};

export async function getArchitectureShares(architectureId: string): Promise<ArchitectureShareListResponse> {
  return apiGetSealedManifestAware<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares`,
  );
}

export async function upsertArchitectureShare(
  architectureId: string,
  userId: string,
  body: UpsertArchitectureShareRequest,
): Promise<void> {
  await apiPutNoContent(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares/${encodeURIComponent(userId.trim())}`,
    body,
  );
}

export async function deleteArchitectureShare(architectureId: string, userId: string): Promise<void> {
  await apiDelete(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares/${encodeURIComponent(userId.trim())}`,
  );
}

export async function setArchitectureRestrictToShares(
  architectureId: string,
  body: SetArchitectureRestrictToSharesRequest,
): Promise<ArchitectureRestrictToSharesResponse> {
  return apiPutJson<ArchitectureRestrictToSharesResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/restrict-to-shares`,
    body,
  );
}
