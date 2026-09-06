import type { OidcTokenResponse } from "@/lib/oidc/token-client";

const BFF_SESSION_SYNC_PATH = "/api/auth/bff-session";

function resolveExpiresInSeconds(expiresIn: number | undefined): number {
  const defaultExpiresInSec = 3600;

  if (expiresIn === undefined) {
    return defaultExpiresInSec;
  }

  const numericExpiresIn = Number(expiresIn);

  if (!Number.isFinite(numericExpiresIn) || numericExpiresIn <= 0) {
    return defaultExpiresInSec;
  }

  return Math.trunc(numericExpiresIn);
}

/** Dual-mode P1: mirror the browser OIDC access token into an HttpOnly BFF cookie (LK-05). */
export async function syncBffSessionCookieFromTokenResponse(tokens: OidcTokenResponse): Promise<void> {
  if (typeof fetch === "undefined") {
    return;
  }

  const accessToken = tokens.access_token?.trim() ?? "";

  if (accessToken.length === 0) {
    return;
  }

  try {
    await fetch(BFF_SESSION_SYNC_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        expires_in: resolveExpiresInSeconds(tokens.expires_in),
      }),
    });
  } catch {
    // Dual-mode: sessionStorage Bearer remains until LK-06 removes the client token path.
  }
}

/** Clears the HttpOnly BFF session cookie during sign-out. */
export async function clearBffSessionCookie(): Promise<void> {
  if (typeof fetch === "undefined") {
    return;
  }

  try {
    await fetch(BFF_SESSION_SYNC_PATH, {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    // Sign-out still clears sessionStorage even when the BFF route is unavailable.
  }
}
