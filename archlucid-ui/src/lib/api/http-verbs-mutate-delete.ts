/** HTTP DELETE mutating verb helpers. */

import { captureTraceContextFromResponse } from "@/lib/correlation";

import { ensureOidcBearerReady } from "./http-auth";
import {
  applyCorrelationHeaders,
  resolveRequest,
  serverFetchInit,
} from "./http-proxy";
import { throwApiRequestError } from "./http-verbs-get";
import { notifyIfIdempotencyReplayed } from "./http-verbs-mutate-shared";

/** DELETEs a path; returns void on 2xx. Throws on HTTP errors. */
export async function apiDelete(path: string): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  const response = await fetch(url, serverFetchInit(h, { method: "DELETE" }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}
