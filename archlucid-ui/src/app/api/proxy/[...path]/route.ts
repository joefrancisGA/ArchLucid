import { NextRequest, NextResponse } from "next/server";
import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
} from "@/lib/correlation";
import { resolveUpstreamApiBaseUrlForProxy } from "@/lib/config";
import { buildProxyUpstreamPath } from "@/lib/proxy-upstream-path";
import { declaredPostBodyExceedsLimit, readRequestBodyBytesWithLimit } from "@/lib/proxy-body-read";
import {
  resolveProxyMaxBodyBytes,
} from "@/lib/proxy-constants";
import { enforceProxyRateLimit } from "@/lib/proxy-rate-limit";
import {
  IDEMPOTENCY_REPLAYED_HEADER,
  buildProxyUpstreamHeaders,
} from "@/lib/proxy/proxy-upstream-headers";
import {
  logProxyDiagnostic,
  respondWithProxyProblem,
} from "@/lib/proxy/proxy-problem-response";
import { PROXY_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { resolveProxyUpstreamFetchTimeout } from "@/lib/resolve-proxy-upstream-fetch-timeout";
import { trySandboxProxyMock } from "@/lib/sandbox-proxy-mocks";
import { resolveProxyUpstreamScopeHeaders } from "@/lib/proxy-scope-resolution";
import { formatProxyUpstreamUnreachableDetail, isProxyUpstreamTimeoutFailure } from "@/lib/proxy-upstream-unreachable-detail";
import { fetchWithWarmupRetry } from "@/lib/warmup-retry";
import { shouldTraceProxyInteractiveReadHang } from "@/lib/proxy/should-trace-proxy-interactive-read-hang";
import { normalizeProxyPathForTelemetry } from "@/lib/telemetry/normalize-proxy-path-for-telemetry";
import {
  applyServerTimingHeader,
  elapsedMsSince,
  logServerRequestTiming,
  shouldLogSlowOrFailedRequest,
} from "@/lib/telemetry/server-request-timing";

/** Forwards JSON/binary calls to the upstream C# API (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`). */
type ForwardMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Forwards `POST`/`PUT`/`PATCH` with JSON or multipart body; multipart evidence uploads allow up to 100 MB. */
async function forwardMutatingWithBody(
  request: NextRequest,
  method: "POST" | "PUT" | "PATCH",
  pathForLog: string,
  correlationId: string,
  targetUrl: string,
  headers: Headers,
): Promise<NextResponse> {
  const contentType = request.headers.get("content-type");
  const maxBodyBytes = resolveProxyMaxBodyBytes(pathForLog, contentType);
  const upstreamTimeout = resolveProxyUpstreamFetchTimeout(pathForLog, contentType);
  const upstreamTimeoutMs = upstreamTimeout.timeoutMs;

  const tooLargeByHeader = declaredPostBodyExceedsLimit(
    request.headers.get("content-length"),
    maxBodyBytes,
  );

  if (tooLargeByHeader !== false) {
    logProxyDiagnostic("body_too_large", {
      method,
      path: pathForLog,
      declaredLength: tooLargeByHeader.declaredLength,
      maxBytes: maxBodyBytes,
      correlationId,
    });
    return respondWithProxyProblem(
      413,
      {
        type: "about:blank",
        title: "Payload too large",
        status: 413,
        detail: `Request body (${tooLargeByHeader.declaredLength} bytes) exceeds the proxy limit of ${maxBodyBytes} bytes.`,
      },
      correlationId,
    );
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  // Binary-safe buffer so DOCX/PDF/ZIP multipart parts are not UTF-8 mangled.
  const body = await readRequestBodyBytesWithLimit(request.body, maxBodyBytes);

  if (body === null) {
    logProxyDiagnostic("body_too_large_streaming", {
      method,
      path: pathForLog,
      maxBytes: maxBodyBytes,
      correlationId,
    });
    return respondWithProxyProblem(
      413,
      {
        type: "about:blank",
        title: "Payload too large",
        status: 413,
        detail: `Request body exceeded the proxy limit of ${maxBodyBytes} bytes during streaming read.`,
      },
      correlationId,
    );
  }

  // DOM BodyInit expects Uint8Array<ArrayBuffer>; stream chunks may be ArrayBufferLike.
  const fetchBody: BodyInit | undefined =
    body.byteLength === 0 ? undefined : new Uint8Array(body);

  let res: Response;

  try {
    res = await fetch(targetUrl, {
      method,
      headers,
      body: fetchBody,
      cache: "no-store",
      signal: AbortSignal.timeout(upstreamTimeoutMs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const detail = formatProxyUpstreamUnreachableDetail({
      method,
      path: pathForLog,
      timeoutMs: upstreamTimeoutMs,
      causeMessage: message,
    });
    logProxyDiagnostic("upstream_fetch_failed", {
      method,
      path: pathForLog,
      message,
      timeoutMs: upstreamTimeoutMs,
      timeoutKind: upstreamTimeout.kind,
      timedOut: isProxyUpstreamTimeoutFailure(message) ? 1 : 0,
      correlationId,
    });
    return respondWithProxyProblem(
      502,
      {
        type: "about:blank",
        title: "Upstream API unreachable",
        status: 502,
        detail,
        instance: `${method} /${pathForLog}`,
        upstreamMethod: method,
        upstreamPath: pathForLog,
        upstreamTimeoutMs: upstreamTimeoutMs,
        supportHint:
          "Confirm the ArchLucid API is running and reachable from this machine. Check ARCHLUCID_API_BASE_URL and see docs/runbooks/TROUBLESHOOTING.md.",
      },
      correlationId,
    );
  }

  if (!res.ok) {
    logProxyDiagnostic("upstream_non_success", {
      method,
      path: pathForLog,
      status: res.status,
      correlationId,
    });
  }

  return await passThrough(res);
}

/** Forwards GET/POST/PUT/PATCH/DELETE after applying rate limits, sandbox mocks, and upstream config validation. */
async function forward(
  request: NextRequest,
  pathSegments: string[],
  method: ForwardMethod,
): Promise<NextResponse> {
  const builtPath = buildProxyUpstreamPath(pathSegments);

  if (!builtPath.ok) {
    const correlationId = generateCorrelationId();
    return respondWithProxyProblem(
      400,
      {
        type: "about:blank",
        title: "Invalid proxy path",
        status: 400,
        detail: "Proxy path segments must not contain traversal or empty components.",
      },
      correlationId,
    );
  }

  const path = builtPath.path;
  const upstreamHeaders = buildProxyUpstreamHeaders(request, path);
  const correlationId =
    upstreamHeaders.get(CORRELATION_ID_HEADER)?.trim() ?? generateCorrelationId();

  const sandbox = trySandboxProxyMock(method, pathSegments, correlationId);

  if (sandbox) {
    return sandbox;
  }

  const resolved = resolveUpstreamApiBaseUrlForProxy();

  if (!resolved.ok) {
    logProxyDiagnostic("upstream_config_invalid", {
      detail: resolved.detail,
      correlationId,
    });
    return respondWithProxyProblem(
      503,
      {
        type: "about:blank",
        title: "Invalid upstream API configuration",
        status: 503,
        detail: resolved.detail,
        supportHint:
          "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local to the API root (e.g. http://localhost:5128). Restart the dev server after editing.",
      },
      correlationId,
    );
  }

  const base = resolved.baseUrl;
  const normalizedTailPath = path.length > 0 ? path.toLowerCase() : "";
  const authMePrivateCacheSeconds =
    method === "GET" && normalizedTailPath === "api/auth/me" ? 60 : undefined;
  const search = request.nextUrl.search;
  const targetUrl = `${base}/${path}${search}`;
  const pathForLog = path.length > 0 ? path : "_";
  const traceInteractiveReadHang = shouldTraceProxyInteractiveReadHang(
    method,
    normalizedTailPath,
  );

  const headers = upstreamHeaders;

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    return forwardMutatingWithBody(request, method, pathForLog, correlationId, targetUrl, headers);
  }

  if (method === "DELETE") {
    let res: Response;

    try {
      res = await fetch(targetUrl, {
        method: "DELETE",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(PROXY_UPSTREAM_FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const detail = formatProxyUpstreamUnreachableDetail({
        method,
        path: pathForLog,
        timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
        causeMessage: message,
      });
      logProxyDiagnostic("upstream_fetch_failed", {
        method,
        path: pathForLog,
        message,
        timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
        correlationId,
      });
      return respondWithProxyProblem(
        502,
        {
          type: "about:blank",
          title: "Upstream API unreachable",
          status: 502,
          detail,
          instance: `${method} /${pathForLog}`,
          upstreamMethod: method,
          upstreamPath: pathForLog,
          upstreamTimeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
          supportHint:
            "Confirm the ArchLucid API is running and reachable from this machine. Check ARCHLUCID_API_BASE_URL and see docs/runbooks/TROUBLESHOOTING.md.",
        },
        correlationId,
      );
    }

    if (!res.ok) {
      logProxyDiagnostic("upstream_non_success", {
        method,
        path: pathForLog,
        status: res.status,
        correlationId,
      });
    }

    return await passThrough(res);
  }

  let res: Response;

  const upstreamFetchStartedAtMs = performance.now();

  if (traceInteractiveReadHang) {
    logProxyDiagnostic("upstream_fetch_started", {
      method,
      path: pathForLog,
      correlationId,
      targetUrl,
    });
  }

  try {
    res = await fetchWithWarmupRetry(
      () =>
        fetch(targetUrl, {
          method: "GET",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(PROXY_UPSTREAM_FETCH_TIMEOUT_MS),
        }),
      {
        onRetry: ({ attemptIndex, reason, status }) => {
          logProxyDiagnostic("upstream_warmup_retry", {
            method,
            path: pathForLog,
            attempt: attemptIndex + 1,
            reason,
            status,
            correlationId,
          });
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const detail = formatProxyUpstreamUnreachableDetail({
      method,
      path: pathForLog,
      timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
      causeMessage: message,
    });

    if (traceInteractiveReadHang) {
      logProxyDiagnostic("upstream_fetch_timed_out", {
        method,
        path: pathForLog,
        message,
        durationMs: Math.round(performance.now() - upstreamFetchStartedAtMs),
        timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
        correlationId,
      });
    }

    logProxyDiagnostic("upstream_fetch_failed", {
      method,
      path: pathForLog,
      message,
      timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
      correlationId,
    });
    return respondWithProxyProblem(
      502,
      {
        type: "about:blank",
        title: "Upstream API unreachable",
        status: 502,
        detail,
        instance: `${method} /${pathForLog}`,
        upstreamMethod: method,
        upstreamPath: pathForLog,
        upstreamTimeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
        supportHint:
          "Confirm the ArchLucid API is running and reachable from this machine. Check ARCHLUCID_API_BASE_URL and see docs/runbooks/TROUBLESHOOTING.md.",
      },
      correlationId,
    );
  }

  if (!res.ok) {
    logProxyDiagnostic("upstream_non_success", {
      method,
      path: pathForLog,
      status: res.status,
      correlationId,
    });
  }

  if (traceInteractiveReadHang) {
    logProxyDiagnostic("upstream_fetch_completed", {
      method,
      path: pathForLog,
      status: res.status,
      durationMs: Math.round(performance.now() - upstreamFetchStartedAtMs),
      correlationId,
    });
  }

  return await passThrough(res, authMePrivateCacheSeconds);
}

/** HTTP statuses that must not carry a body (undici/Next throw if a stream is attached). */
function isNullBodyStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

/**
 * Passes the upstream response body and key headers (Content-Type, Content-Disposition) to the browser.
 * Optional **private** cache hints apply only to successful GET responses when callers opt in (e.g. `/api/auth/me`).
 */
async function passThrough(res: Response, cacheControlPrivateMaxAgeSeconds?: number): Promise<NextResponse> {
  let body: BodyInit | null;

  if (isNullBodyStatus(res.status)) {
    body = null;
  } else {
    const contentType = res.headers.get("content-type") ?? "";

    if (res.ok && contentType.includes("application/json")) {
      const text = await res.text();
      body = text.trim().length === 0 ? "{}" : text;
    } else {
      body = res.body;
    }
  }

  // Upstream 204 (e.g. marketing quote-request) may expose an empty ReadableStream; attaching it
  // to NextResponse throws and surfaces as 500 to the browser form.
  const out = new NextResponse(body, { status: res.status });

  const contentType = res.headers.get("content-type");

  if (contentType) {
    out.headers.set("Content-Type", contentType);
  }

  const disposition = res.headers.get("content-disposition");

  if (disposition) {
    out.headers.set("Content-Disposition", disposition);
  }

  const correlation = res.headers.get(CORRELATION_ID_HEADER);

  if (correlation && correlation.trim().length > 0) {
    out.headers.set(CORRELATION_ID_HEADER, correlation.trim());
  }

  const traceId = res.headers.get("X-Trace-Id");

  if (traceId && traceId.trim().length > 0) {
    out.headers.set("X-Trace-Id", traceId.trim());
  }

  const traceParent = res.headers.get("traceparent");

  if (traceParent && traceParent.trim().length > 0) {
    out.headers.set("traceparent", traceParent.trim());
  }

  const idempotencyReplayed = res.headers.get(IDEMPOTENCY_REPLAYED_HEADER);

  if (idempotencyReplayed && idempotencyReplayed.trim().length > 0) {
    out.headers.set(IDEMPOTENCY_REPLAYED_HEADER, idempotencyReplayed.trim());
  }

  if (
    cacheControlPrivateMaxAgeSeconds !== undefined &&
    cacheControlPrivateMaxAgeSeconds >= 0 &&
    res.ok
  ) {
    out.headers.set("Cache-Control", `private, max-age=${cacheControlPrivateMaxAgeSeconds}`);
  }

  return out;
}

async function handleRateLimitedForward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
  method: ForwardMethod,
): Promise<NextResponse> {
  const startedAtMs = performance.now();
  const rateLimited = enforceProxyRateLimit(request);

  if (rateLimited) {
    const totalMs = elapsedMsSince(startedAtMs);
    applyServerTimingHeader(rateLimited.headers, [{ name: "proxy", durationMs: totalMs }]);

    return rateLimited;
  }

  const { path } = await context.params;
  const pathSegments = path ?? [];
  const response = await forward(request, pathSegments, method);
  const totalMs = elapsedMsSince(startedAtMs);
  applyServerTimingHeader(response.headers, [{ name: "proxy", durationMs: totalMs }]);

  const pathForLog = pathSegments.length > 0 ? pathSegments.join("/") : "_";
  const normalizedPath = normalizeProxyPathForTelemetry(pathForLog);

  if (shouldLogSlowOrFailedRequest(totalMs, response.status)) {
    logServerRequestTiming("proxy_request", {
      method,
      path: normalizedPath,
      status: response.status,
      durationMs: totalMs,
      correlationId: response.headers.get("X-Correlation-ID")?.trim() || undefined,
    });
  }

  return response;
}

/** Allow long-running multipart evidence forwards (up to 100 MB) on hosted Node runtimes. */
export const maxDuration = 600;

/** Handles GET requests from browser components → forwards to C# API with server-side credentials. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "GET");
}

/** Handles POST requests from browser components → forwards to C# API with server-side credentials. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "POST");
}

/** Handles PUT requests (tenant settings, webhook references, etc.) from browser-safe same-origin callers. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "PUT");
}

/** Handles PATCH requests (draft intake, run pin, alert archive, etc.) from browser-safe same-origin callers. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "PATCH");
}

/** Handles DELETE requests (resource teardown) from browser-safe same-origin callers. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleRateLimitedForward(request, context, "DELETE");
}
