import { isSafeOidcEndpointUrl } from "@/lib/oidc/discovery";
import {
  coerceAcceptedOidcEpochMsHint,
  normalizeOidcConfigurationString,
  normalizeOidcOAuthFormString,
  normalizeOptionalOidcOAuthFormToken,
  normalizeRequiredOidcOAuthFormToken,
  parseOidcEpochMsHint,
} from "@/lib/oidc/oauth-callback-messages";
import { resolveExpiresInSeconds } from "@/lib/oidc/resolve-expires-in-seconds";
import type { OidcTokenResponse } from "@/lib/oidc/token-client";
import { applyBffCsrfHeader, readBffCsrfTokenFromDocument } from "@/lib/proxy/bff-session-csrf-client";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { readWorkspaceModeFromStorage } from "@/lib/workspace-mode/workspace-mode-preference";

const BFF_SESSION_SYNC_PATH = "/api/auth/bff-session";
const BFF_SESSION_REFRESH_PATH = "/api/auth/bff-session/refresh";
const BFF_SESSION_ACTIVITY_PATH = "/api/auth/bff-session/activity";
const BFF_SESSION_RP_LOGOUT_URL_PATH = "/api/auth/bff-session/rp-logout-url";

/** Parity with `session.ts` expiry skew when accepting BFF refresh hints. */
const BFF_REFRESH_EXPIRY_SKEW_MS = 60_000;

function parseBffExpiresAtMs(raw: unknown): number {
  if (typeof raw === "string") {
    return parseOidcEpochMsHint(raw);
  }

  if (typeof raw !== "number") {
    return Number.NaN;
  }

  return coerceAcceptedOidcEpochMsHint(raw);
}

function resolveWorkingModeForBffSession(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return isWorkingWorkspaceMode(readWorkspaceModeFromStorage());
}

function buildBffMutationHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  applyBffCsrfHeader(headers);

  return headers;
}

/** LK-06 P2: mirror OIDC token material into the HttpOnly BFF cookie (no sessionStorage tokens). */
export async function syncBffSessionCookieFromTokenResponse(tokens: OidcTokenResponse): Promise<void> {
  if (typeof fetch === "undefined") {
    return;
  }

  const accessToken = normalizeRequiredOidcOAuthFormToken(tokens.access_token);

  if (accessToken.length === 0) {
    return;
  }

  const refreshToken = normalizeOptionalOidcOAuthFormToken(tokens.refresh_token);
  const idToken = normalizeOptionalOidcOAuthFormToken(tokens.id_token);

  let response: Response;

  try {
    response = await fetch(BFF_SESSION_SYNC_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        expires_in: resolveExpiresInSeconds(tokens.expires_in),
        refresh_token: refreshToken,
        id_token: idToken,
        working_mode: resolveWorkingModeForBffSession(),
      }),
    });
  } catch {
    // Proxy session requires BFF signing secret on the host.
    return;
  }

  // 503 means this host has no BFF signing secret, so client hints can stand alone.
  if (response.status === 503) {
    return;
  }

  if (!response.ok) {
    throw new Error("BFF session cookie was not issued");
  }
}

/**
 * Clears the HttpOnly BFF session cookie during sign-out.
 * Returns false when the route responds but does not clear the cookie.
 * A network failure still returns true so local hints can be dropped when the route is unreachable.
 */
export async function clearBffSessionCookie(): Promise<boolean> {
  if (typeof fetch === "undefined") {
    return true;
  }

  let response: Response;

  try {
    response = await fetch(BFF_SESSION_SYNC_PATH, {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    // Sign-out still clears client session hints when the BFF route is unreachable.
    return true;
  }

  return response.ok;
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
      headers: buildBffMutationHeaders(),
    });

    if (response.ok) {
      const body = (await response.json()) as { expires_at_ms?: number | string };
      const expiresAtMs = parseBffExpiresAtMs(body.expires_at_ms);

      if (Number.isFinite(expiresAtMs) && expiresAtMs > Date.now() - BFF_REFRESH_EXPIRY_SKEW_MS) {
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

export type BffSessionActivityPulseResult = "ok" | "unauthorized" | "ignored";

/** Slides server-side BFF idle activity during presenter / print / export keepalive (LK-07). */
export async function pulseBffSessionActivity(): Promise<BffSessionActivityPulseResult> {
  if (typeof fetch === "undefined") {
    return "ignored";
  }

  const csrfToken = readBffCsrfTokenFromDocument();

  if (csrfToken === undefined) {
    return "ignored";
  }

  try {
    const response = await fetch(BFF_SESSION_ACTIVITY_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: buildBffMutationHeaders(),
      body: JSON.stringify({
        working_mode: resolveWorkingModeForBffSession(),
      }),
    });

    if (response.status === 401 || response.status === 403) {
      return "unauthorized";
    }

    if (!response.ok) {
      return "ignored";
    }

    return "ok";
  } catch {
    // Client idle UX still runs when the activity route is unavailable.
    return "ignored";
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
    const url =
      typeof body.url !== "string"
        ? ""
        : normalizeOidcOAuthFormString(body.url);

    if (url.length === 0 || !isSafeOidcEndpointUrl(url)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}
