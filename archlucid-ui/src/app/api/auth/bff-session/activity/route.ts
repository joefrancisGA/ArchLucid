import { NextRequest, NextResponse } from "next/server";

import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import {
  BFF_SESSION_COOKIE_NAME,
  buildBffSessionClearCookieHeaders,
  buildBffSessionCookieHeaders,
  isBffSessionCookieEnabled,
  parseBffSessionCookieValue,
  slideBffSessionActivity,
} from "@/lib/proxy/bff-session-cookie";
import { isBffSessionIdleExpired } from "@/lib/proxy/bff-session-idle";

type BffSessionActivityPostBody = {
  readonly working_mode?: boolean;
};

/** Slides BFF session idle activity from UI heartbeat / presenter / print keepalive (LK-07). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isBffSessionCookieEnabled()) {
    return NextResponse.json(
      { title: "BFF session unavailable", detail: "Signing secret is not configured on this host." },
      { status: 503 },
    );
  }

  const cookieValue = request.cookies.get(BFF_SESSION_COOKIE_NAME)?.value ?? null;
  const payload = cookieValue !== null ? parseBffSessionCookieValue(cookieValue) : null;

  if (payload === null || Date.now() >= payload.exp) {
    return NextResponse.json({ title: "No active BFF session" }, { status: 401 });
  }

  if (isBffSessionIdleExpired(payload)) {
    const response = NextResponse.json({ title: "BFF session idle timeout" }, { status: 401 });

    for (const cookieHeader of buildBffSessionClearCookieHeaders()) {
      response.headers.append("Set-Cookie", cookieHeader);
    }

    return response;
  }

  const csrfHeader = request.headers.get(BFF_CSRF_HEADER)?.trim() ?? "";

  if (csrfHeader.length === 0 || csrfHeader !== payload.csrf) {
    return NextResponse.json({ title: "CSRF validation failed" }, { status: 403 });
  }

  let body: BffSessionActivityPostBody = {};

  try {
    body = (await request.json()) as BffSessionActivityPostBody;
  } catch {
    body = {};
  }

  const issueResult = slideBffSessionActivity(payload, {
    workingMode: body.working_mode === true ? true : payload.wm === 1,
  });

  if (issueResult === null) {
    return NextResponse.json({ title: "Failed to slide BFF session activity" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, expires_at_ms: payload.exp });

  for (const cookieHeader of buildBffSessionCookieHeaders(issueResult, payload.exp)) {
    response.headers.append("Set-Cookie", cookieHeader);
  }

  return response;
}
