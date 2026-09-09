import { captureTraceContextFromResponse } from "@/lib/correlation";

import { ensureOidcBearerReady } from "@/lib/api/http-auth";
import {
  applyCorrelationHeaders,
  resolveRequest,
  serverFetchInit,
} from "@/lib/api/http-proxy";
import { throwApiRequestError } from "@/lib/api/http-verbs-get";
import { notifyIfIdempotencyReplayed } from "@/lib/api/http-verbs-mutate-shared";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { findingUnmuteMutationBlockedReason } from "@/lib/findings/finding-unmute-mutation-blocked-reason";

/** Clears a finding mute for one authority run (ExecuteAuthority). */
export async function deleteFindingMute(runId: string, findingId: string): Promise<void> {
  await ensureOidcBearerReady();
  const encodedFinding = encodeURIComponent(findingId);
  const { url, headers } = await resolveRequest(`/v1/findings/${encodedFinding}/mute`);
  const { headers: requestHeaders, correlationId } = applyCorrelationHeaders(headers);

  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(
    url,
    serverFetchInit(requestHeaders, {
      method: "DELETE",
      body: JSON.stringify({ runId }),
    }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    try {
      throwApiRequestError(response, text, correlationId);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = findingUnmuteMutationBlockedReason(failure);

      throw new Error(blocked ?? failure.message);
    }
  }

  notifyIfIdempotencyReplayed(response);
}
