import { NextRequest, NextResponse } from "next/server";

import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
  isSafeCorrelationId,
} from "@/lib/correlation";

/**
 * V1 Operator Shell — OS-1 (LATEST.md improvement #1).
 *
 * Internal route handler that bridges the Reviews empty-state seed button to the upstream demo seed endpoint.
 * Forwards POST to `/api/proxy/v1/demo/seed` (which adds API key / bearer / scope headers via the existing proxy).
 * On upstream `204 No Content`, returns `{ redirectTo: "/reviews" }` with status 200 so the client component
 * can refresh the reviews list. All other upstream statuses are passed through (preserving Problem Details).
 */

const SEED_TARGET_PATH = "/api/proxy/v1/demo/seed";

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

function buildSeedTargetUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin;

  return `${origin}${SEED_TARGET_PATH}`;
}

function buildRedirectResponse(correlationId: string): NextResponse {
  const res = NextResponse.json({ redirectTo: "/reviews" }, { status: 200 });
  res.headers.set(CORRELATION_ID_HEADER, correlationId);

  return res;
}

async function buildPassThroughResponse(
  upstream: Response,
  correlationId: string,
): Promise<NextResponse> {
  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const res = new NextResponse(text.length > 0 ? text : null, { status: upstream.status });

  res.headers.set("Content-Type", contentType);
  res.headers.set(CORRELATION_ID_HEADER, correlationId);

  return res;
}

/**
 * Handles `POST /api/seed-sample`. Returns `{ redirectTo: "/reviews" }` on upstream 204; otherwise passes the
 * upstream status and body through so the caller can surface a Problem Details toast.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = readBrowserCorrelationId(request);
  const headers = buildForwardHeaders(request, correlationId);
  const targetUrl = buildSeedTargetUrl(request);

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error contacting demo seed proxy.";
    const res = NextResponse.json(
      {
        type: "about:blank",
        title: "Sample seed unavailable",
        status: 502,
        detail: message,
        correlationId,
      },
      { status: 502 },
    );
    res.headers.set(CORRELATION_ID_HEADER, correlationId);

    return res;
  }

  if (upstream.status === 204) {
    return buildRedirectResponse(correlationId);
  }

  return buildPassThroughResponse(upstream, correlationId);
}
