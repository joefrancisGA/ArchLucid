/** HTTP PUT JSON mutating verb helpers. */

import { captureTraceContextFromResponse } from "@/lib/correlation";

import { ensureOidcBearerReady } from "./http-auth";
import {
  applyCorrelationHeaders,
  resolveRequest,
  serverFetchInit,
} from "./http-proxy";
import { throwApiRequestError } from "./http-verbs-get";
import { notifyIfIdempotencyReplayed } from "./http-verbs-mutate-shared";

/** PUTs a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPutJson<T>(path: string, body: unknown): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, serverFetchInit(h, { method: "PUT", body: JSON.stringify(body) }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  if (text.length === 0) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/** PUTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPutNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(url, serverFetchInit(h, { method: "PUT", body: JSON.stringify(body) }));
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}
