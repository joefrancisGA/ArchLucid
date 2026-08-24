import { NextRequest, NextResponse } from "next/server";

import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
  isSafeCorrelationId,
} from "@/lib/correlation";

/**
 * Internal route handler for the dev testing quick-switch "Reset Database" action.
 * Forwards POST to `/api/proxy/v1/diagnostics/reset-development-catalog`.
 */

const RESET_TARGET_PATH = "/api/proxy/v1/diagnostics/reset-development-catalog";

function readBrowserCorrelationId(request: NextRequest): string {
  const incoming = request.headers.get(CORRELATION_ID_HEADER);

  if (isSafeCorrelationId(incoming)) {
    return (incoming ?? "").trim();
  }

  return generateCorrelationId();
}

function buildForwardHeaders(request: NextRequest, correlationId: string): Headers {
  const headers = new Headers();

  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set(CORRELATION_ID_HEADER, correlationId);

  const authorization = request.headers.get("authorization");

  if (authorization !== null && authorization.trim().length > 0) {
    headers.set("Authorization", authorization);
  }

  const cookie = request.headers.get("cookie");

  if (cookie !== null && cookie.trim().length > 0) {
    headers.set("Cookie", cookie);
  }

  return headers;
}

function buildResetTargetUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin;

  return `${origin}${RESET_TARGET_PATH}`;
}

function resolveResponseCorrelationId(upstream: Response, fallbackCorrelationId: string): string {
  const upstreamCorrelationId = upstream.headers.get(CORRELATION_ID_HEADER)?.trim() ?? "";

  if (upstreamCorrelationId.length > 0) {
    return upstreamCorrelationId;
  }

  return fallbackCorrelationId;
}

async function buildPassThroughResponse(
  upstream: Response,
  correlationId: string,
): Promise<NextResponse> {
  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const res = new NextResponse(text.length > 0 ? text : null, { status: upstream.status });
  const responseCorrelationId = resolveResponseCorrelationId(upstream, correlationId);

  res.headers.set("Content-Type", contentType);
  res.headers.set(CORRELATION_ID_HEADER, responseCorrelationId);

  return res;
}

/** Handles `POST /api/reset-database` by proxying to the development catalog reset API. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = readBrowserCorrelationId(request);
  const headers = buildForwardHeaders(request, correlationId);
  const targetUrl = buildResetTargetUrl(request);

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error contacting development catalog reset proxy.";
    const res = NextResponse.json(
      {
        type: "about:blank",
        title: "Database reset unavailable",
        status: 502,
        detail: `${message} (target: ${RESET_TARGET_PATH})`,
        correlationId,
      },
      { status: 502 },
    );
    res.headers.set(CORRELATION_ID_HEADER, correlationId);

    return res;
  }

  return buildPassThroughResponse(upstream, correlationId);
}
