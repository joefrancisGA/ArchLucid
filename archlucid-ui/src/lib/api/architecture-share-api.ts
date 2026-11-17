import type { components } from "@/lib/api-types/schemas.generated";
import { captureTraceContextFromResponse } from "@/lib/correlation";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { throwApiRequestError } from "./http-verbs-get";
import { ensureOidcBearerReady } from "./http-auth";
import { applyCorrelationHeaders, resolveRequest, serverFetchInit } from "./http-proxy";
import { apiPatchJson, apiPutJson } from "./http";
import { notifyIfIdempotencyReplayed } from "./http-verbs-mutate-shared";
import { encodeRequiredPathSegment, isRecord } from "./api-boundary-normalization";

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
    `${ARCHITECTURES_BASE}/${encodeRequiredPathSegment(architectureId, "architectureId")}/shares`,
  );
}

export async function putArchitectureShare(
  architectureId: string,
  body: PutArchitectureShareRequest,
): Promise<ArchitectureShareListResponse> {
  return apiPutJson<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeRequiredPathSegment(architectureId, "architectureId")}/shares`,
    body,
  );
}

export async function revokeArchitectureShare(
  architectureId: string,
  targetActorOid: string,
): Promise<ArchitectureShareListResponse> {
  await ensureOidcBearerReady();
  const path = `${ARCHITECTURES_BASE}/${encodeRequiredPathSegment(architectureId, "architectureId")}/shares/${encodeRequiredPathSegment(targetActorOid, "targetActorOid")}`;
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  const response = await fetch(url, serverFetchInit(h, { method: "DELETE" }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  if (text.trim().length === 0) {
    throw new Error("Architecture share response was not returned.");
  }

  const parsed: unknown = JSON.parse(text);

  if (!isRecord(parsed)) {
    throw new Error("Architecture share response was not recognized.");
  }

  return parsed as ArchitectureShareListResponse;
}

export async function patchArchitectureRestrictToShares(
  architectureId: string,
  body: PatchArchitectureRestrictToSharesRequest,
): Promise<ArchitectureShareListResponse> {
  return apiPatchJson<ArchitectureShareListResponse>(
    `${ARCHITECTURES_BASE}/${encodeRequiredPathSegment(architectureId, "architectureId")}/restrict-to-shares`,
    body,
  );
}
