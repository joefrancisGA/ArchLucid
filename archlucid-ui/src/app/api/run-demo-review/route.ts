import { NextRequest, NextResponse } from "next/server";

import { resolveUpstreamApiBaseUrlForProxy } from "@/lib/config";
import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
  isSafeCorrelationId,
} from "@/lib/correlation";
import { readServerSideApiKey } from "@/lib/legacy-arch-env";
import { resolveProxyUpstreamScopeHeaders } from "@/lib/proxy-scope-resolution";

/**
 * Internal route handler bridging the operator one-click demo review button to
 * `POST /api/proxy/v1/reviews/demo`. On success returns `{ redirectTo, runId, policyPackName }`.
 */

const DEMO_REVIEW_TARGET_PATH = "/api/proxy/v1/reviews/demo";

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
  const browserBearer = authorization?.trim() ?? "";

  if (browserBearer.length > 0) {
    headers.set("Authorization", browserBearer);
  }

  const key = readServerSideApiKey()?.trim() ?? "";

  if (key.length > 0 && browserBearer.length === 0) {
    headers.set("X-Api-Key", key);
  }

  for (const [headerName, headerValue] of Object.entries(resolveProxyUpstreamScopeHeaders(request.headers))) {
    headers.set(headerName, headerValue);
  }

  const cookie = request.headers.get("cookie");

  if (cookie !== null && cookie.trim().length > 0) {
    headers.set("Cookie", cookie);
  }

  return headers;
}

function buildDemoReviewTargetUrl(request: NextRequest): string {
  const resolved = resolveUpstreamApiBaseUrlForProxy();

  if (resolved.ok) {
    return `${resolved.baseUrl}/v1/reviews/demo`;
  }

  return `${request.nextUrl.origin}${DEMO_REVIEW_TARGET_PATH}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function buildSuccessResponse(upstreamBody: unknown, correlationId: string): NextResponse {
  let redirectTo = "/architecture/reviews";

  if (isRecord(upstreamBody)) {
    const runDetailUrl = readStringField(upstreamBody, "runDetailUrl");
    const runId = readStringField(upstreamBody, "runId");

    if (runDetailUrl !== null) {
      redirectTo = runDetailUrl;
    } else if (runId !== null) {
      redirectTo = `/architecture/reviews/${encodeURIComponent(runId)}`;
    }
  }

  const res = NextResponse.json(
    {
      ...(isRecord(upstreamBody) ? upstreamBody : {}),
      redirectTo,
    },
    { status: 200 },
  );
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

/** Handles `POST /api/run-demo-review`. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = readBrowserCorrelationId(request);
  const headers = buildForwardHeaders(request, correlationId);
  const targetUrl = buildDemoReviewTargetUrl(request);

  let upstream: Response;

  try {
    upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: "{}",
      cache: "no-store",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error contacting demo review proxy.";
    const res = NextResponse.json(
      {
        type: "about:blank",
        title: "Demo review unavailable",
        status: 502,
        detail: message,
        correlationId,
      },
      { status: 502 },
    );
    res.headers.set(CORRELATION_ID_HEADER, correlationId);

    return res;
  }

  if (upstream.ok) {
    let body: unknown = null;

    try {
      body = await upstream.json();
    } catch {
      body = null;
    }

    return buildSuccessResponse(body, correlationId);
  }

  return buildPassThroughResponse(upstream, correlationId);
}
