import type { components } from "@/lib/api-types/schemas.generated";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiDelete, apiPutJson, apiPutNoContent } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureShareGrant = components["schemas"]["ArchitectureShareGrantResponse"];

export type ArchitectureShareListResponse = components["schemas"]["ArchitectureShareListResponse"];

export type UpsertArchitectureShareRequest = components["schemas"]["UpsertArchitectureShareRequest"];

export type SetArchitectureRestrictToSharesRequest =
  components["schemas"]["SetArchitectureRestrictToSharesRequest"];

export type ArchitectureRestrictToSharesResponse =
  components["schemas"]["ArchitectureRestrictToSharesResponse"];

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
