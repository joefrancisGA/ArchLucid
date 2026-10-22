/** Proxy routing, scope headers, and fetch init for ArchLucid API calls. */

import { CORRELATION_ID_HEADER, applyTraceParentHeader, generateCorrelationId } from "@/lib/correlation";
import { getServerApiBaseUrl } from "@/lib/config";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { getScopeHeaders } from "@/lib/scope";
import { SERVER_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { applyBffCsrfHeader } from "@/lib/proxy/bff-session-csrf-client";

import {
  audienceHeadersForCurrentShell,
  getServerAuthHeaders,
  isBrowser,
} from "./http-auth";

/**
 * Same-origin proxy path for browser JSON/binary calls. Vitest/jsdom exposes `window` but Node `fetch`
 * requires an absolute URL — use a stable localhost base only under Vitest.
 */
export function browserProxyUrl(path: string): string {
  const relative = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  if (typeof process !== "undefined" && process.env.VITEST !== undefined) {
    return new URL(relative, "http://localhost").href;
  }

  return relative;
}

export async function resolveScopeHeadersForRequest(): Promise<Record<string, string>> {
  if (isBrowser()) {
    return getEffectiveBrowserProxyScopeHeaders();
  }

  // Server RSC loaders that need cookie scope must pass `scopeHeaders` explicitly
  // (see load-run-detail-page-model.ts). Shared http helpers stay client-importable.
  return getScopeHeaders();
}

/**
 * Same routing as JSON calls, but Accept allows binary artifact bodies (UTF-8 text from synthesis).
 */
export async function resolveBinaryGetRequest(path: string): Promise<{ url: string; headers: HeadersInit }> {
  if (isBrowser()) {
    const url = browserProxyUrl(path);
    const headers: Record<string, string> = {
      Accept: "*/*",
      ...(await resolveScopeHeadersForRequest()),
    };

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...(await resolveScopeHeadersForRequest()),
    ...getServerAuthHeaders(),
  };

  return { url, headers };
}

/**
 * Builds URL + headers for a JSON GET/POST.
 * Server (RSC): direct to backend with API key + scope headers.
 * Browser: same-origin `/api/proxy` so secrets stay server-side.
 */
export async function resolveRequest(
  path: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<{ url: string; headers: HeadersInit }> {
  if (isBrowser()) {
    const url = browserProxyUrl(path);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(await resolveScopeHeadersForRequest()),
      ...audienceHeadersForCurrentShell(),
    };

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options?.scopeHeaders ?? (await resolveScopeHeadersForRequest())),
    ...getServerAuthHeaders(),
    ...audienceHeadersForCurrentShell(),
  };

  return { url, headers };
}

/** Applies a fresh correlation id header; returns headers and id for error fallback (TB-271). */
export function applyCorrelationHeaders(headers: HeadersInit): { headers: Headers; correlationId: string } {
  const correlationId = generateCorrelationId();
  const h = new Headers(headers);
  h.set(CORRELATION_ID_HEADER, correlationId);
  applyTraceParentHeader(h);

  return { headers: h, correlationId };
}

export function withCorrelationHeaders(headers: HeadersInit): Headers {
  return applyCorrelationHeaders(headers).headers;
}

/** Returns the trace id from the `X-Trace-Id` response header, or null if absent. */
export function extractTraceId(response: Response): string | null {
  return response.headers.get("X-Trace-Id") ?? null;
}

export function serverFetchInit(
  headers: Headers,
  init?: { readonly method?: string; readonly body?: string; readonly signal?: AbortSignal },
): RequestInit {
  const method = init?.method?.toUpperCase() ?? "GET";
  const requestInit: RequestInit = {
    cache: "no-store",
    headers,
    ...init,
  };

  if (isBrowser()) {
    requestInit.credentials = "same-origin";

    if (method !== "GET" && method !== "HEAD") {
      applyBffCsrfHeader(headers);
    }
  }

  if (init?.signal !== undefined) {
    requestInit.signal = init.signal;
  } else if (!isBrowser()) {
    requestInit.signal = AbortSignal.timeout(SERVER_UPSTREAM_FETCH_TIMEOUT_MS);
  }

  return requestInit;
}
