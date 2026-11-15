import type { ArchitectureWorkLeaseConflictResponse, ArchitectureWorkLeaseResponse } from "@/types/draft-intake-work-lease";

import { encodeRequiredPathSegment, parseJsonRecord } from "@/lib/api/api-boundary-normalization";
import { isApiRequestError } from "@/lib/api-request-error";
import { ensureOidcBearerReady, apiDelete, apiPostJson } from "@/lib/api/http";
import { applyCorrelationHeaders, resolveRequest, serverFetchInit } from "@/lib/api/http-proxy";
import { captureTraceContextFromResponse } from "@/lib/correlation";

/** Builds the work-lease path. A blank draft id throws before any request is sent. */
const draftWorkLeasePath = (draftId: string, suffix: string) =>
  `/v1/architecture/draft/${encodeRequiredPathSegment(draftId, "draftId")}/work-lease${suffix}`;

/** Reads a 409 body as a lease conflict only when it names both the draft and the current holder. */
function toWorkLeaseConflict(text: string): ArchitectureWorkLeaseConflictResponse | null {
  const conflict = parseJsonRecord<ArchitectureWorkLeaseConflictResponse>(text);

  return conflict !== null && conflict.draftId && conflict.holderUserId ? conflict : null;
}

export type DraftWorkLeaseAcquireOutcome =
  | { readonly kind: "acquired"; readonly lease: ArchitectureWorkLeaseResponse }
  | { readonly kind: "held-by-other"; readonly conflict: ArchitectureWorkLeaseConflictResponse }
  | { readonly kind: "unavailable" };

export async function tryAcquireDraftWorkLease(draftId: string): Promise<DraftWorkLeaseAcquireOutcome> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(draftWorkLeasePath(draftId, "/acquire"));
  const { headers: requestHeaders } = applyCorrelationHeaders(headers);
  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(
    url,
    serverFetchInit(requestHeaders, { method: "POST", body: "{}" }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (response.status === 409) {
    const conflict = toWorkLeaseConflict(text);

    return conflict === null ? { kind: "unavailable" } : { kind: "held-by-other", conflict };
  }

  if (!response.ok) {
    return { kind: "unavailable" };
  }

  // A success status with an empty or malformed body is not a usable lease.
  const lease = parseJsonRecord<ArchitectureWorkLeaseResponse>(text);

  return lease === null ? { kind: "unavailable" } : { kind: "acquired", lease };
}

export async function heartbeatDraftWorkLease(draftId: string): Promise<ArchitectureWorkLeaseResponse> {
  return apiPostJson<ArchitectureWorkLeaseResponse>(draftWorkLeasePath(draftId, "/heartbeat"), {});
}

export async function stealDraftWorkLease(draftId: string): Promise<ArchitectureWorkLeaseResponse> {
  return apiPostJson<ArchitectureWorkLeaseResponse>(draftWorkLeasePath(draftId, "/steal"), {});
}

export async function releaseDraftWorkLease(draftId: string): Promise<void> {
  await apiDelete(draftWorkLeasePath(draftId, ""));
}

export function readDraftWorkLeaseHeartbeatLost(error: unknown): boolean {
  return isApiRequestError(error) && error.httpStatus === 409;
}
