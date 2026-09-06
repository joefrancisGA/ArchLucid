import type { OidcTokenResponse } from "@/lib/oidc/token-client";

const BFF_SESSION_SYNC_PATH = "/api/auth/bff-session";
const BFF_SESSION_REFRESH_PATH = "/api/auth/bff-session/refresh";
const BFF_SESSION_RP_LOGOUT_URL_PATH = "/api/auth/bff-session/rp-logout-url";

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

/** LK-06 P2: mirror OIDC token material into the HttpOnly BFF cookie (no sessionStorage tokens). */
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
        refresh_token: tokens.refresh_token ?? undefined,
        id_token: tokens.id_token ?? undefined,
      }),
    });
  } catch {
    // Proxy session requires BFF signing secret on the host.
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
    // Sign-out still clears client session hints even when the BFF route is unavailable.
  }
}

export type BffSessionRefreshResult =
  | { readonly ok: true; readonly expiresAtMs: number }
  | { readonly ok: false; readonly shouldClearSession: boolean };

/** Server-side token refresh via HttpOnly BFF cookie (LK-06 P2). */
export async function refreshBffSessionCookie(): Promise<BffSessionRefreshResult> {
  if (typeof fetch === "undefined") {
    return { ok: false, shouldClearSession: false };
  }

  try {
    const response = await fetch(BFF_SESSION_REFRESH_PATH, {
      method: "POST",
      credentials: "same-origin",
    });

    if (response.ok) {
      const body = (await response.json()) as { expires_at_ms?: number };
      const expiresAtMs = Number(body.expires_at_ms);

      if (Number.isFinite(expiresAtMs) && expiresAtMs > 0) {
        return { ok: true, expiresAtMs };
      }

      return { ok: false, shouldClearSession: false };
    }

    return {
      ok: false,
      shouldClearSession: response.status === 401 || response.status === 403,
    };
  } catch {
    return { ok: false, shouldClearSession: false };
  }
}

/** Resolves an OIDC RP-initiated logout URL from the HttpOnly session (id_token_hint). */
export async function resolveRpLogoutUrlFromBffSession(): Promise<string | null> {
  if (typeof fetch === "undefined") {
    return null;
  }

  try {
    const response = await fetch(BFF_SESSION_RP_LOGOUT_URL_PATH, {
      method: "GET",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { url?: string | null };
    const url = body.url?.trim() ?? "";

    return url.length > 0 ? url : null;
  } catch {
    return null;
  }
}
