/** HTTP mutating verb helpers (POST, PATCH, PUT, DELETE). */

import { captureTraceContextFromResponse } from "@/lib/correlation";

import { ensureOidcBearerReady, isBrowser } from "./http-auth";
import {
  applyCorrelationHeaders,
  resolveRequest,
  serverFetchInit,
} from "./http-proxy";
import { throwApiRequestError } from "./http-verbs-get";

function notifyIfIdempotencyReplayed(response: Response): void {
  if (isBrowser() && response.headers.get("X-Idempotency-Replayed") === "true") {
    void import("@/lib/toast").then(({ showInfo }) => {
      showInfo("Resumed previous request — no duplicate review created.");
    });
  }
}

/** POSTs a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPostJson<T>(
  path: string,
  body: unknown,
  options?: { readonly extraHeaders?: Record<string, string> },
): Promise<T> {
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

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

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

/** PATCHes a JSON body to the ArchLucid API and returns the parsed response. Throws on HTTP errors. */
export async function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(
    url,
    serverFetchInit(h, { method: "PATCH", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);

  return JSON.parse(text) as T;
}

/** POSTs a JSON body to the ArchLucid API and expects no response body. Throws on HTTP errors. */
export async function apiPostNoContent(path: string, body: unknown): Promise<void> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(path);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");
  const response = await fetch(
    url,
    serverFetchInit(h, { method: "POST", body: JSON.stringify(body) }),
  );
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  notifyIfIdempotencyReplayed(response);
}

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
