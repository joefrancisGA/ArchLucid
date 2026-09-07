import { NextRequest, NextResponse } from "next/server";

import {
  buildBffSessionClearCookieHeaders,
  buildBffSessionCookieHeaders,
  createBffSessionCookieValue,
  isBffSessionCookieEnabled,
} from "@/lib/proxy/bff-session-cookie";

type BffSessionPostBody = {
  readonly access_token?: string;
  readonly expires_in?: number;
  readonly refresh_token?: string;
  readonly id_token?: string;
  readonly working_mode?: boolean;
};

function resolveExpiresAtMs(expiresIn: number | undefined): number {
  const defaultExpiresInSec = 3600;
  const numericExpiresIn = expiresIn === undefined ? defaultExpiresInSec : Number(expiresIn);
  const expiresInSec =
    Number.isFinite(numericExpiresIn) && numericExpiresIn > 0
      ? Math.trunc(numericExpiresIn)
      : defaultExpiresInSec;

  return Date.now() + expiresInSec * 1000;
}

/** Issues the HttpOnly BFF session cookie after browser sign-in (ADR 0059 P1 / LK-05). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isBffSessionCookieEnabled()) {
    return NextResponse.json(
      { title: "BFF session unavailable", detail: "Signing secret is not configured on this host." },
      { status: 503 },
    );
  }

  let body: BffSessionPostBody;

  try {
    body = (await request.json()) as BffSessionPostBody;
  } catch {
    return NextResponse.json({ title: "Invalid JSON body" }, { status: 400 });
  }

  const accessToken = body.access_token?.trim() ?? "";

  if (accessToken.length === 0) {
    return NextResponse.json({ title: "access_token is required" }, { status: 400 });
  }

  const expiresAtMs = resolveExpiresAtMs(body.expires_in);
  const issueResult = createBffSessionCookieValue({
    accessToken,
    expiresAtMs,
    refreshToken: body.refresh_token ?? null,
    idToken: body.id_token ?? null,
    workingMode: body.working_mode === true,
  });

  if (issueResult === null) {
    return NextResponse.json({ title: "Failed to issue BFF session cookie" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });

  for (const cookieHeader of buildBffSessionCookieHeaders(issueResult, expiresAtMs)) {
    response.headers.append("Set-Cookie", cookieHeader);
  }

  return response;
}

/** Clears the HttpOnly BFF session cookie on sign-out. */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });

  for (const cookieHeader of buildBffSessionClearCookieHeaders()) {
    response.headers.append("Set-Cookie", cookieHeader);
  }

  return response;
}
