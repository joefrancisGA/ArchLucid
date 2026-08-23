import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ProxyJsonRequestInit = Omit<RequestInit, "method" | "body">;

function buildProxyJsonRequestInit(
  method: string,
  init?: ProxyJsonRequestInit,
  body?: string,
): { readonly requestInit: RequestInit; readonly correlationId: string } {
  const scoped = mergeRegistrationScopeForProxy({
    credentials: "include",
    ...init,
    method,
    body,
  });

  const headers = new Headers(scoped.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(headers);

  return {
    requestInit: { ...scoped, headers: correlatedHeaders },
    correlationId,
  };
}

/** Maps a failed `/api/proxy/*` response to {@link ApiLoadFailureState}. */
export function normalizeProxyJsonResponseFailure(
  response: Response,
  bodyText: string,
  correlationId: string,
): ApiLoadFailureState {
  return toApiLoadFailure(buildApiRequestErrorFromParts(response, bodyText, correlationId));
}

async function proxyJsonFetch<T>(
  path: string,
  method: string,
  init?: ProxyJsonRequestInit,
  body?: string,
): Promise<T> {
  const { requestInit, correlationId } = buildProxyJsonRequestInit(method, init, body);

  let response: Response;

  try {
    response = await fetch(path, requestInit);
  } catch (error: unknown) {
    throw toApiLoadFailure(error);
  }

  const text = await response.text();

  if (!response.ok) {
    throw normalizeProxyJsonResponseFailure(response, text, correlationId);
  }

  if (text.trim().length === 0) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error: unknown) {
    throw toApiLoadFailure(error instanceof Error ? error : new Error("Invalid JSON in proxy response."));
  }
}

/** GET JSON from same-origin `/api/proxy/*` with scope headers and {@link ApiLoadFailureState} failures. */
export function proxyJsonGet<T>(path: string, init?: ProxyJsonRequestInit): Promise<T> {
  return proxyJsonFetch<T>(path, "GET", init);
}

/** PUT JSON to same-origin `/api/proxy/*` with scope headers and {@link ApiLoadFailureState} failures. */
export function proxyJsonPut<T>(path: string, body: unknown, init?: ProxyJsonRequestInit): Promise<T> {
  return proxyJsonFetch<T>(path, "PUT", init, JSON.stringify(body));
}
