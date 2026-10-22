import type { components } from "@/lib/api-types/schemas.generated";
import { captureTraceContextFromResponse } from "@/lib/correlation";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { throwApiRequestError } from "./http-verbs-get";
import { ensureOidcBearerReady } from "./http-auth";
import { applyCorrelationHeaders, resolveRequest, serverFetchInit } from "./http-proxy";
import { apiPatchJson, apiPutJson } from "./http";
import { notifyIfIdempotencyReplayed } from "./http-verbs-mutate-shared";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureShareListResponse =
  components["schemas"]["ArchitectureShareListResponse"];

export type ArchitectureShareResponse =
  components["schemas"]["ArchitectureShareResponse"];

export type PutArchitectureShareRequest =
  components["schemas"]["PutArchitectureShareRequest"];

export type PatchArchitectureRestrictToSharesRequest =
  components["schemas"]["PatchArchitectureRestrictToSharesRequest"];

export async function getArchitectureShares(
  architectureId: string,
): Promise<ArchitectureShareListResponse> {
  return apiGetSealedManifestAware<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares`,
  );
}

export async function putArchitectureShare(
  architectureId: string,
  body: PutArchitectureShareRequest,
): Promise<ArchitectureShareListResponse> {
  return apiPutJson<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares`,
    body,
  );
}

export async function revokeArchitectureShare(
  architectureId: string,
  targetActorOid: string,
): Promise<ArchitectureShareListResponse> {
  await ensureOidcBearerReady();
  const path = `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/shares/${encodeURIComponent(targetActorOid.trim())}`;
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  const response = await fetch(url, serverFetchInit(h, { method: "DELETE" }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as ArchitectureShareListResponse;
}

export async function patchArchitectureRestrictToShares(
  architectureId: string,
  body: PatchArchitectureRestrictToSharesRequest,
): Promise<ArchitectureShareListResponse> {
  return apiPatchJson<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/restrict-to-shares`,
    body,
  );
}
