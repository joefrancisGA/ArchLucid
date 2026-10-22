import type { ArchitectureWorkLeaseConflictResponse, ArchitectureWorkLeaseResponse } from "@/types/draft-intake-work-lease";

import { isApiRequestError } from "@/lib/api-request-error";
import { ensureOidcBearerReady, apiDelete, apiPostJson } from "@/lib/api/http";
import { applyCorrelationHeaders, resolveRequest, serverFetchInit } from "@/lib/api/http-proxy";
import { captureTraceContextFromResponse } from "@/lib/correlation";

const draftWorkLeasePath = (draftId: string, suffix: string) =>
  `/v1/architecture/draft/${encodeURIComponent(draftId)}/work-lease${suffix}`;

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
    try {
      const conflict = JSON.parse(text) as ArchitectureWorkLeaseConflictResponse;

      if (conflict.draftId && conflict.holderUserId) {
        return { kind: "held-by-other", conflict };
      }
    } catch {
      return { kind: "unavailable" };
    }

    return { kind: "unavailable" };
  }

  if (!response.ok) {
    return { kind: "unavailable" };
  }

  return { kind: "acquired", lease: JSON.parse(text) as ArchitectureWorkLeaseResponse };
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
