/** HTTP POST 202 Accepted + Location mutating verb helpers. */

import { captureTraceContextFromResponse } from "@/lib/correlation";

import { ensureOidcBearerReady } from "./http-auth";
import {
  applyCorrelationHeaders,
  resolveRequest,
  serverFetchInit,
} from "./http-proxy";
import { throwApiRequestError } from "./http-verbs-get";
import { notifyIfIdempotencyReplayed } from "./http-verbs-mutate-shared";

/**
 * POSTs JSON and accepts Tier C async semantics: HTTP 202 + Location (TB-2075 / TB-2077).
 * Empty bodies are allowed; callers parse the Location header for the operation handle.
 */
export async function apiPostAcceptedWithLocation(
  path: string,
  body: unknown,
  options?: { readonly extraHeaders?: Record<string, string> },
): Promise<{ readonly location: string | null; readonly status: number }> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  if (options?.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      h.set(key, value);
    }
  }

  const response = await fetch(
    url,
    serverFetchInit(h, { method: "POST", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (response.status !== 202) {
    if (!response.ok) {
      throwApiRequestError(response, text, correlationId);
    }

    throwApiRequestError(
      response,
      text.length > 0 ? text : "Expected 202 Accepted with a Location header.",
      correlationId,
    );
  }

  notifyIfIdempotencyReplayed(response);

  return {
    location: response.headers.get("Location"),
    status: response.status,
  };
}
