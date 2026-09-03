import type { NextRequest, NextResponse } from "next/server";

import { declaredPostBodyExceedsLimit, readRequestBodyBytesWithLimit } from "@/lib/proxy-body-read";
import { resolveProxyMaxBodyBytes } from "@/lib/proxy-constants";
import { resolveProxyUpstreamFetchTimeout } from "@/lib/resolve-proxy-upstream-fetch-timeout";
import { passThrough } from "@/lib/proxy/proxy-passthrough";
import {
  logProxyDiagnostic,
  respondWithProxyProblem,
} from "@/lib/proxy/proxy-problem-response";

import { logUpstreamNonSuccess, respondWithUpstreamFetchFailure } from "./proxy-forward-upstream-errors";

/** Copies the incoming request Content-Type onto upstream headers when present. */
export function copyMutatingRequestContentType(request: NextRequest, headers: Headers): void {
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }
}

/** Forwards `POST`/`PUT`/`PATCH` with JSON or multipart body; multipart evidence uploads allow up to 100 MB. */
export async function forwardMutatingWithBody(
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

  copyMutatingRequestContentType(request, headers);

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

    return respondWithUpstreamFetchFailure({
      method,
      pathForLog,
      correlationId,
      timeoutMs: upstreamTimeoutMs,
      causeMessage: message,
      timeoutKind: upstreamTimeout.kind,
    });
  }

  if (!res.ok) {
    logUpstreamNonSuccess(method, pathForLog, res.status, correlationId);
  }

  return passThrough(res);
}
