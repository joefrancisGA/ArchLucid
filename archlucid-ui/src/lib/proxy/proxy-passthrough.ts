import { NextResponse } from "next/server";

import {
  CORRELATION_ID_HEADER,
} from "@/lib/correlation";
import {
  IDEMPOTENCY_REPLAYED_HEADER,
} from "@/lib/proxy/proxy-upstream-headers";

/** HTTP statuses that must not carry a body (undici/Next throw if a stream is attached). */
export function isNullBodyStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

/**
 * Passes the upstream response body and key headers (Content-Type, Content-Disposition) to the browser.
 * Optional **private** cache hints apply only to successful GET responses when callers opt in (e.g. `/api/auth/me`).
 */
export async function passThrough(res: Response, cacheControlPrivateMaxAgeSeconds?: number): Promise<NextResponse> {
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

  const location = res.headers.get("Location");

  if (location !== null && location.trim().length > 0) {
    out.headers.set("Location", location.trim());
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
