import { NextRequest, NextResponse } from "next/server";

import { getOidcAuthority, getOidcClientId } from "@/lib/oidc/config";
import { loadDiscoveryDocument } from "@/lib/oidc/discovery";
import { refreshAccessToken } from "@/lib/oidc/token-client";
import { BFF_CSRF_HEADER } from "@/lib/proxy/bff-session-constants";
import {
  buildBffSessionCookieHeaders,
  createBffSessionCookieValue,
  isBffSessionCookieEnabled,
  parseBffSessionPayloadFromRequest,
} from "@/lib/proxy/bff-session-cookie";

function resolveExpiresAtMs(expiresIn: number | undefined): number {
  const defaultExpiresInSec = 3600;
  const numericExpiresIn = expiresIn === undefined ? defaultExpiresInSec : Number(expiresIn);
  const expiresInSec =
    Number.isFinite(numericExpiresIn) && numericExpiresIn > 0
      ? Math.trunc(numericExpiresIn)
      : defaultExpiresInSec;

  return Date.now() + expiresInSec * 1000;
}

function shouldClearSessionOnRefreshFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  ) {
    return false;
  }

  if (/token endpoint error (5\d{2}|408)\b/.test(message)) {
    return false;
  }

  return (
    message.includes("invalid_grant") ||
    message.includes("invalid_token") ||
    message.includes("token endpoint error 400") ||
    message.includes("token endpoint error 401") ||
    message.includes("token endpoint error 403")
  );
}

/** Refreshes the HttpOnly BFF session using the server-held refresh token (LK-06 P2). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isBffSessionCookieEnabled()) {
    return NextResponse.json(
      { title: "BFF session unavailable", detail: "Signing secret is not configured on this host." },
      { status: 503 },
    );
  }

  const payload = parseBffSessionPayloadFromRequest(request);
  const refreshToken = payload?.rt?.trim() ?? "";
  const authority = getOidcAuthority();
  const clientId = getOidcClientId();

  if (payload === null || refreshToken.length === 0) {
    return NextResponse.json({ title: "No refreshable BFF session" }, { status: 401 });
  }

  const csrfHeader = request.headers.get(BFF_CSRF_HEADER)?.trim() ?? "";

  if (csrfHeader.length === 0 || csrfHeader !== payload.csrf) {
    return NextResponse.json({ title: "CSRF validation failed" }, { status: 403 });
  }

  if (authority.length === 0 || clientId.length === 0) {
    return NextResponse.json({ title: "OIDC is not configured on this host" }, { status: 503 });
  }

  try {
    const doc = await loadDiscoveryDocument(authority);
    const tokens = await refreshAccessToken({
      tokenEndpoint: doc.token_endpoint,
      clientId,
      refreshToken,
    });
    const expiresAtMs = resolveExpiresAtMs(tokens.expires_in);
    const issueResult = createBffSessionCookieValue({
      accessToken: tokens.access_token,
      expiresAtMs,
      lastActivityAtMs: Date.now(),
      csrfToken: payload.csrf,
      workingMode: payload.wm === 1,
      refreshToken: tokens.refresh_token ?? refreshToken,
      idToken: tokens.id_token ?? payload.it ?? null,
    });

    if (issueResult === null) {
      return NextResponse.json({ title: "Failed to refresh BFF session cookie" }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, expires_at_ms: expiresAtMs });

    for (const cookieHeader of buildBffSessionCookieHeaders(issueResult, expiresAtMs)) {
      response.headers.append("Set-Cookie", cookieHeader);
    }

    return response;
  } catch (error: unknown) {
    if (shouldClearSessionOnRefreshFailure(error)) {
      return NextResponse.json({ title: "Refresh token rejected" }, { status: 401 });
    }

    return NextResponse.json({ title: "Transient refresh failure" }, { status: 503 });
  }
}
