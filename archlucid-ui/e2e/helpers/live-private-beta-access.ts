/**
 * Private-beta access-path helpers (TB-797): JwtBearer invite + browser session injection +
 * `/me` scope assertions. CI cannot run a real IdP OIDC redirect — inject minted JWTs into
 * sessionStorage to simulate post-sign-in state and validate returnUrl / deep-link behavior.
 */
import type { APIRequestContext, Page } from "@playwright/test";

import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
} from "@/lib/oidc/storage-keys";

import {
  getLiveJwtTokenFromEnvSync,
  isLiveJwtTokenConfigured,
} from "./jwt-token-provider";
import { liveApiBase, liveJsonHeaders, resolveLiveJwtMode } from "./live-api-client";

/** Matches {@link ScopeIds.DefaultTenant} when JWT omits scope claims. */
export const LIVE_E2E_DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";

/** Matches {@link ScopeIds.DefaultWorkspace}. */
export const LIVE_E2E_DEFAULT_WORKSPACE_ID = "22222222-2222-2222-2222-222222222222";

/** Matches {@link ScopeIds.DefaultProject}. */
export const LIVE_E2E_DEFAULT_PROJECT_ID = "33333333-3333-3333-3333-333333333333";

export type LivePrivateBetaScopeClaims = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
};

export type LiveAuthMeProxyBody = {
  name?: string | null;
  claims?: ReadonlyArray<{ type: string; value: string }>;
};

export function requireLivePrivateBetaJwtEnv(): { accessToken: string; proxyBearer: string } {
  if (!resolveLiveJwtMode()) {
    throw new Error("Set LIVE_JWT_TOKEN to run private-beta JwtBearer access-path smoke.");
  }

  const accessToken = getLiveJwtTokenFromEnvSync();
  const proxyBearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

  if (accessToken.length === 0) {
    throw new Error("LIVE_JWT_TOKEN is empty.");
  }

  if (proxyBearer.length === 0) {
    throw new Error(
      "ARCHLUCID_PROXY_BEARER_TOKEN must match LIVE_JWT_TOKEN so /api/proxy forwards Authorization in CI.",
    );
  }

  return { accessToken, proxyBearer };
}

export function isLivePrivateBetaJwtConfigured(): boolean {
  return isLiveJwtTokenConfigured();
}

/** Registers init script so the next navigation starts with a signed-in JWT browser session. */
export async function primeJwtBrowserSession(page: Page, accessToken: string): Promise<void> {
  const expiresAtMs = Date.now() + 3_600_000;

  await page.addInitScript(
    ({ tokenKey, expiresKey, token, expiresAt }) => {
      sessionStorage.setItem(tokenKey, token);
      sessionStorage.setItem(expiresKey, String(expiresAt));
    },
    {
      tokenKey: OIDC_ACCESS_TOKEN_KEY,
      expiresKey: OIDC_EXPIRES_AT_MS_KEY,
      token: accessToken,
      expiresAt: expiresAtMs,
    },
  );
}

/** Writes JWT session material into the current document (post-navigation recovery). */
export async function writeJwtBrowserSession(page: Page, accessToken: string): Promise<void> {
  const expiresAtMs = Date.now() + 3_600_000;

  await page.evaluate(
    ({ tokenKey, expiresKey, token, expiresAt }) => {
      sessionStorage.setItem(tokenKey, token);
      sessionStorage.setItem(expiresKey, String(expiresAt));
    },
    {
      tokenKey: OIDC_ACCESS_TOKEN_KEY,
      expiresKey: OIDC_EXPIRES_AT_MS_KEY,
      token: accessToken,
      expiresAt: expiresAtMs,
    },
  );
}

/** Clears OIDC sessionStorage keys to simulate expiry / signed-out state. */
export async function clearJwtBrowserSession(page: Page): Promise<void> {
  await page.evaluate(
    ({ tokenKey, expiresKey }) => {
      sessionStorage.removeItem(tokenKey);
      sessionStorage.removeItem(expiresKey);
    },
    { tokenKey: OIDC_ACCESS_TOKEN_KEY, expiresKey: OIDC_EXPIRES_AT_MS_KEY },
  );
}

export function readClaimValue(
  claims: ReadonlyArray<{ type: string; value: string }> | undefined,
  claimType: string,
): string | undefined {
  if (claims === undefined) {
    return undefined;
  }

  for (const claim of claims) {
    if (claim.type === claimType && claim.value.trim().length > 0) {
      return claim.value.trim();
    }
  }

  return undefined;
}

export function resolveScopeFromAuthMe(
  body: LiveAuthMeProxyBody,
  expected: LivePrivateBetaScopeClaims,
): LivePrivateBetaScopeClaims {
  const claims = body.claims ?? [];

  return {
    tenantId: readClaimValue(claims, "tenant_id") ?? expected.tenantId,
    workspaceId: readClaimValue(claims, "workspace_id") ?? expected.workspaceId,
    projectId: readClaimValue(claims, "project_id") ?? expected.projectId,
  };
}

export async function fetchAuthMeViaProxy(page: Page): Promise<LiveAuthMeProxyBody> {
  const result = await page.evaluate(async () => {
    const res = await fetch("/api/proxy/api/auth/me", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();

    return { status: res.status, text };
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`GET /api/proxy/api/auth/me failed ${result.status}: ${result.text.slice(0, 400)}`);
  }

  return JSON.parse(result.text) as LiveAuthMeProxyBody;
}

export type LiveAdminInviteResult = {
  id: string;
  email: string;
  invitationToken: string;
};

export type LiveInvitationValidationResult = {
  status: string;
  maskedInvitedEmail?: string | null;
  appRole?: string | null;
};

export async function createAdminUserInvite(
  request: APIRequestContext,
  email: string,
): Promise<LiveAdminInviteResult> {
  const res = await request.post(`${liveApiBase}/v1/admin/users/invite`, {
    headers: liveJsonHeaders(),
    data: { email, appRole: "Reader", message: "TB-797 private-beta access-path smoke" },
  });

  if (!res.ok()) {
    const body = await res.text();

    throw new Error(`POST /v1/admin/users/invite failed ${res.status()}: ${body.slice(0, 400)}`);
  }

  const created = (await res.json()) as {
    id?: string;
    email?: string;
    invitationToken?: string;
  };

  if (!created.id || !created.email || !created.invitationToken) {
    throw new Error("Invite response missing id, email, or invitationToken.");
  }

  return { id: created.id, email: created.email, invitationToken: created.invitationToken };
}

/** Anonymous validate before sign-in; uses live API base (not browser proxy). */
export async function validateInvitationToken(
  request: APIRequestContext,
  invitationToken: string,
): Promise<LiveInvitationValidationResult> {
  const url = new URL(`${liveApiBase}/v1/auth/invitations/validate`);

  url.searchParams.set("token", invitationToken);

  const res = await request.get(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok()) {
    const body = await res.text();

    throw new Error(`GET /v1/auth/invitations/validate failed ${res.status()}: ${body.slice(0, 400)}`);
  }

  const body = (await res.json()) as LiveInvitationValidationResult;

  if (!body.status) {
    throw new Error("Invitation validate response missing status.");
  }

  return body;
}

export async function listPendingInvitations(request: APIRequestContext): Promise<unknown[]> {
  const res = await request.get(`${liveApiBase}/v1/admin/users/invitations`, {
    headers: liveJsonHeaders(),
  });

  if (!res.ok()) {
    const body = await res.text();

    throw new Error(`GET /v1/admin/users/invitations failed ${res.status()}: ${body.slice(0, 400)}`);
  }

  const body = (await res.json()) as { invitations?: unknown[] };

  return Array.isArray(body.invitations) ? body.invitations : [];
}
