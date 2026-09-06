import { NextRequest, NextResponse } from "next/server";
import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
} from "@/lib/correlation";
import { resolveUpstreamApiBaseUrlForProxy } from "@/lib/config";
import { buildProxyUpstreamPath } from "@/lib/proxy-upstream-path";
import { enforceProxyRateLimit } from "@/lib/proxy-rate-limit";
import {
  buildProxyUpstreamHeaders,
} from "@/lib/proxy/proxy-upstream-headers";
import {
  logProxyDiagnostic,
  respondWithProxyProblem,
} from "@/lib/proxy/proxy-problem-response";
import { passThrough } from "@/lib/proxy/proxy-passthrough";
import { resolveProxyUpstreamFetchTimeout } from "@/lib/resolve-proxy-upstream-fetch-timeout";
import { PROXY_UPSTREAM_FETCH_TIMEOUT_MS } from "@/lib/server-fetch-timeouts";
import { trySandboxProxyMock } from "@/lib/sandbox-proxy-mocks";
import { fetchWithWarmupRetry } from "@/lib/warmup-retry";
import {
  appendProxyBffSlideCookieHeaders,
  enforceProxyBffSessionGuard,
} from "@/lib/proxy/proxy-bff-session-guard";
import { normalizeProxyPathForTelemetry } from "@/lib/telemetry/normalize-proxy-path-for-telemetry";
import {
  applyServerTimingHeader,
  elapsedMsSince,
  logServerRequestTiming,
  shouldLogSlowOrFailedRequest,
} from "@/lib/telemetry/server-request-timing";

import { forwardMutatingWithBody } from "./proxy-forward-mutating-body";
import { logUpstreamNonSuccess, respondWithUpstreamFetchFailure } from "./proxy-forward-upstream-errors";
import type { ForwardMethod } from "./proxy-forward-types";

export type { ForwardMethod } from "./proxy-forward-types";

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

  const bffGuard = enforceProxyBffSessionGuard(request, method, correlationId);

  if (!bffGuard.allowed) {
    return bffGuard.response;
  }

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
    const response = await forwardMutatingWithBody(request, method, pathForLog, correlationId, targetUrl, headers);

    return appendProxyBffSlideCookieHeaders(response, bffGuard.slideCookieHeaders);
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

      return respondWithUpstreamFetchFailure({
        method,
        pathForLog,
        correlationId,
        timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
        causeMessage: message,
      });
    }

    if (!res.ok) {
      logUpstreamNonSuccess(method, pathForLog, res.status, correlationId);
    }

    return appendProxyBffSlideCookieHeaders(
      await passThrough(res),
      bffGuard.slideCookieHeaders,
    );
  }

  let res: Response;

  const upstreamFetchStartedAtMs = performance.now();
  const upstreamTimeout = resolveProxyUpstreamFetchTimeout(pathForLog);

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
          signal: AbortSignal.timeout(upstreamTimeout.timeoutMs),
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

    if (traceInteractiveReadHang) {
      logProxyDiagnostic("upstream_fetch_timed_out", {
        method,
        path: pathForLog,
        message,
        durationMs: Math.round(performance.now() - upstreamFetchStartedAtMs),
        timeoutMs: upstreamTimeout.timeoutMs,
        timeoutKind: upstreamTimeout.kind,
        correlationId,
      });
    }

    return respondWithUpstreamFetchFailure({
      method,
      pathForLog,
      correlationId,
      timeoutMs: upstreamTimeout.timeoutMs,
      timeoutKind: upstreamTimeout.kind,
      causeMessage: message,
    });
  }

  if (!res.ok) {
    logUpstreamNonSuccess(method, pathForLog, res.status, correlationId);
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

  return appendProxyBffSlideCookieHeaders(
    await passThrough(res, authMePrivateCacheSeconds),
    bffGuard.slideCookieHeaders,
  );
}

export async function handleRateLimitedForward(
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
